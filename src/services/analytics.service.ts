import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { Product } from '../entities/Product';
import { Customer } from '../entities/Customer';
import { Inventory } from '../entities/Inventory';
import { CacheUtil } from '../utils/cache.util';
import { OrderStatus } from '../types/enums';

function periodToDateRange(period: string): { start: Date; end: Date; days: number } {
  const end = new Date();
  const start = new Date();
  let days = 30;
  switch (period) {
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    case '1y': days = 365; break;
  }
  start.setDate(start.getDate() - days);
  return { start, end, days };
}

/** Fill missing dates in a chart dataset so every day has an entry */
function fillDateGaps<T extends Record<string, unknown>>(
  raw: (T & { date: string })[],
  days: number,
  defaults: Omit<T, 'date'>,
): (T & { date: string })[] {
  const map = new Map(raw.map(r => [r.date, r]));
  const result: (T & { date: string })[] = [];
  const d = new Date();
  d.setDate(d.getDate() - days);
  for (let i = 0; i <= days; i++) {
    d.setDate(d.getDate() + (i === 0 ? 0 : 1));
    const key = d.toISOString().slice(0, 10);
    result.push(map.get(key) ?? { date: key, ...defaults } as T & { date: string });
  }
  return result;
}

export class AnalyticsService {
  async getDashboardStats() {
    const cached = await CacheUtil.get('analytics:dashboard');
    if (cached) return cached;

    const orderRepo = AppDataSource.getRepository(Order);
    const productRepo = AppDataSource.getRepository(Product);
    const customerRepo = AppDataSource.getRepository(Customer);
    const inventoryRepo = AppDataSource.getRepository(Inventory);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Core counts ---
    const [
      totalOrders, todayOrders, monthOrders,
      totalCustomers, newCustomers, totalProducts, pendingOrders,
    ] = await Promise.all([
      orderRepo.count(),
      orderRepo.createQueryBuilder('o').where('o.createdAt >= :d', { d: todayStart }).getCount(),
      orderRepo.createQueryBuilder('o').where('o.createdAt >= :d', { d: monthStart }).getCount(),
      customerRepo.count(),
      customerRepo.createQueryBuilder('c').where('c.createdAt >= :d', { d: monthStart }).getCount(),
      productRepo.count({ where: { isActive: true } }),
      orderRepo.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    // --- Revenue (only delivered orders) ---
    const revenueQb = () => orderRepo.createQueryBuilder('o')
      .select('SUM(o.total)', 'total')
      .where('o.status = :status', { status: OrderStatus.DELIVERED });

    const [totalRevResult, todayRevResult, monthRevResult] = await Promise.all([
      revenueQb().getRawOne(),
      revenueQb().andWhere('o.createdAt >= :d', { d: todayStart }).getRawOne(),
      revenueQb().andWhere('o.createdAt >= :d', { d: monthStart }).getRawOne(),
    ]);

    const totalRevenue = Number(totalRevResult?.total || 0);
    const todayRevenue = Number(todayRevResult?.total || 0);
    const monthRevenue = Number(monthRevResult?.total || 0);

    // --- Revenue chart (last 30 days) ---
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueChartRaw = await orderRepo.createQueryBuilder('o')
      .select('DATE(o.createdAt)', 'date')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('o.createdAt >= :d', { d: thirtyDaysAgo })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('DATE(o.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();
    const revenueChartSparse = revenueChartRaw.map(r => ({
      date: r.date as string,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
    const revenueChart = fillDateGaps(revenueChartSparse, 30, { revenue: 0, orders: 0 });

    // --- Order status chart ---
    const orderStatusRaw = await orderRepo.createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany();
    const orderStatusChart = orderStatusRaw.map(r => ({
      status: r.status,
      count: Number(r.count),
    }));

    // --- Recent orders ---
    const recentOrders = await orderRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'orderNumber', 'total', 'status', 'createdAt', 'guestName'],
    });

    // --- Top products ---
    const topProducts = await productRepo.createQueryBuilder('p')
      .leftJoin('p.images', 'img', 'img.isPrimary = true')
      .select(['p.id', 'p.name', 'p.soldCount', 'p.price', 'img.url'])
      .where('p.isActive = :active', { active: true })
      .orderBy('p.soldCount', 'DESC')
      .take(5)
      .getMany();

    const topProductsMapped = topProducts.map(p => ({
      id: p.id,
      name: p.name,
      soldCount: p.soldCount,
      revenue: p.soldCount * Number(p.price),
      image: p.images?.[0]?.url || null,
    }));

    // --- Low stock products ---
    const lowStockItems = await inventoryRepo.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.product', 'p')
      .where('inv.quantity <= :threshold', { threshold: 5 })
      .andWhere('p.isActive = :active', { active: true })
      .orderBy('inv.quantity', 'ASC')
      .take(6)
      .getMany();

    const lowStockProducts = lowStockItems.map(inv => ({
      id: inv.product.id,
      name: inv.product.name,
      stock: inv.quantity,
    }));

    const stats = {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrders,
      todayOrders,
      monthOrders,
      totalCustomers,
      newCustomers,
      totalProducts,
      pendingOrders,
      averageOrderValue: totalRevenue > 0 && totalOrders > 0 ? totalRevenue / totalOrders : 0,
      revenueChart,
      orderStatusChart,
      recentOrders,
      topProducts: topProductsMapped,
      lowStockProducts,
    };

    await CacheUtil.set('analytics:dashboard', stats, 300);
    return stats;
  }

  async getRevenueAnalytics(period: string) {
    const { start, days } = periodToDateRange(period);
    const orderRepo = AppDataSource.getRepository(Order);
    const chartRaw = await orderRepo.createQueryBuilder('o')
      .select('DATE(o.createdAt)', 'date')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.createdAt >= :start', { start })
      .groupBy('DATE(o.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const chartSparse = chartRaw.map(r => ({
      date: r.date as string,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
    const chart = fillDateGaps(chartSparse, days, { revenue: 0, orders: 0 });

    const totalRevenue = chart.reduce((s, r) => s + r.revenue, 0);
    const completedOrders = chart.reduce((s, r) => s + r.orders, 0);
    const avgDailyRevenue = days > 0 ? totalRevenue / days : 0;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    return { totalRevenue, avgDailyRevenue, completedOrders, avgOrderValue, chart };
  }

  async getProductAnalytics(period: string, limit = 10) {
    const { start } = periodToDateRange(period);
    const productRepo = AppDataSource.getRepository(Product);

    // Top selling products with image and views
    const topProducts = await productRepo.createQueryBuilder('p')
      .leftJoin('p.images', 'img', 'img.isPrimary = true')
      .select(['p.id', 'p.name', 'p.soldCount', 'p.price', 'p.views', 'img.url'])
      .where('p.isActive = :active', { active: true })
      .orderBy('p.soldCount', 'DESC')
      .take(limit)
      .getMany();

    return {
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        soldCount: p.soldCount,
        revenue: p.soldCount * Number(p.price),
        viewCount: p.views,
        image: p.images?.[0]?.url || null,
      })),
    };
  }

  async getCustomerAnalytics(period: string) {
    const { start, days } = periodToDateRange(period);
    const customerRepo = AppDataSource.getRepository(Customer);

    const total = await customerRepo.count();

    // Customer registrations by date
    const chartRaw = await customerRepo.createQueryBuilder('c')
      .select('DATE(c.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('c.createdAt >= :start', { start })
      .groupBy('DATE(c.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const chartSparse = chartRaw.map(r => ({
      date: r.date as string,
      count: Number(r.count),
    }));
    const chart = fillDateGaps(chartSparse, days, { count: 0 });

    return { total, chart };
  }

  async getOrderAnalytics(period: string) {
    const { start } = periodToDateRange(period);
    const orderRepo = AppDataSource.getRepository(Order);

    const statusRaw = await orderRepo.createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.createdAt >= :start', { start })
      .groupBy('o.status')
      .getRawMany();

    const statusBreakdown = statusRaw.map(r => ({
      status: r.status,
      count: Number(r.count),
    }));

    return { statusBreakdown };
  }
}
