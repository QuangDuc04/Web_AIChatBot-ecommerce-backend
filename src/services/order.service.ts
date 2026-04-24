import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { InventoryService } from './inventory.service';
import { OrderFilterDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { AppError } from '../errors';
import { OrderStatus } from '../types/enums';
import { CacheUtil } from '../utils/cache.util';

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class OrderService {
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();
  private inventoryService = new InventoryService();

  // ====== Guest Order Lookup ======

  async lookupOrder(orderNumber?: string, email?: string) {
    if (!orderNumber || !email) {
      throw new AppError('Vui lòng nhập mã đơn hàng và email', 400);
    }

    const order = await this.orderRepo.findByOrderNumberAndEmail(orderNumber, email);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const history = await this.historyRepo.findByOrderId(order.id);
    return { order, statusHistory: history };
  }

  async lookupByContact(contact?: string) {
    if (!contact) {
      throw new AppError('Vui lòng nhập số điện thoại hoặc email', 400);
    }

    const orders = await this.orderRepo.findByContact(contact);
    if (!orders.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    return { orders };
  }

  // ====== Admin ======

  async getAllOrders(filters: OrderFilterDto) {
    return this.orderRepo.findAll(filters);
  }

  async getOrder(orderId: string) {
    return this.orderRepo.findByIdOrFail(orderId);
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, adminId: string) {
    const order = await this.orderRepo.findByIdOrFail(orderId);

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new AppError(
        `Không thể chuyển từ "${order.status}" sang "${dto.status}"`,
        400,
      );
    }

    const updateData: any = { status: dto.status };

    switch (dto.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPING:
        updateData.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        if (order.items) {
          for (const item of order.items) {
            await this.inventoryService.confirmSale(
              item.productId, item.variantId || null, item.quantity, order.orderNumber,
            );
          }
        }
        break;
      case OrderStatus.CANCELLED:
        if (order.items) {
          for (const item of order.items) {
            await this.inventoryService.releaseStock(item.productId, item.variantId || null, item.quantity);
          }
        }
        break;
    }

    const updated = await this.orderRepo.update(orderId, updateData);

    await this.historyRepo.create({
      orderId,
      status: dto.status,
      note: dto.note,
      changedByUserId: adminId,
    });

    // Invalidate dashboard cache
    await CacheUtil.del('analytics:dashboard');

    return updated;
  }

  async getOrderStats() {
    const statusCounts = await this.orderRepo.countByStatus();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRevenue = await this.orderRepo.getRevenue(todayStart, now);
    const monthRevenue = await this.orderRepo.getRevenue(monthStart, now);

    const stats: Record<string, number> = {};
    statusCounts.forEach((row: any) => { stats[row.status] = Number(row.count); });

    return {
      statusCounts: stats,
      todayRevenue,
      monthRevenue,
      pendingOrders: stats[OrderStatus.PENDING] || 0,
    };
  }

  async getRevenue(startDate: string, endDate: string) {
    return this.orderRepo.getRevenueByDate(new Date(startDate), new Date(endDate));
  }

  async bulkUpdateStatus(orderIds: string[], status: OrderStatus, adminId: string, note?: string) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of orderIds) {
      try {
        await this.updateOrderStatus(id, { status, note }, adminId);
        results.push({ id, success: true });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }

    return results;
  }
}
