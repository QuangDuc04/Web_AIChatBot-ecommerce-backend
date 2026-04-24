import { Brackets, Between, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { NotFoundError } from '../errors';
import { OrderFilterDto } from '../dtos/order.dto';
import { deepSanitizeUsers } from '../utils/sanitize.util';

export class OrderRepository {
  private repo: Repository<Order>;

  constructor() {
    this.repo = AppDataSource.getRepository(Order);
  }

  async findAll(filters: OrderFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);

    const qb = this.repo.createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.shippingAddress', 'shippingAddress');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.paymentStatus) qb.andWhere('o.paymentStatus = :ps', { ps: filters.paymentStatus });
    if (filters.paymentMethod) qb.andWhere('o.paymentMethod = :pm', { pm: filters.paymentMethod });
    if (filters.startDate) qb.andWhere('o.createdAt >= :start', { start: filters.startDate });
    if (filters.endDate) qb.andWhere('o.createdAt <= :end', { end: filters.endDate });
    if (filters.search) {
      qb.andWhere(new Brackets(sub => {
        sub.where('o.orderNumber LIKE :s', { s: `%${filters.search}%` })
           .orWhere('customer.name LIKE :s', { s: `%${filters.search}%` })
           .orWhere('customer.email LIKE :s', { s: `%${filters.search}%` })
           .orWhere('o.guestName LIKE :s', { s: `%${filters.search}%` })
           .orWhere('o.guestEmail LIKE :s', { s: `%${filters.search}%` })
           .orWhere('o.guestPhone LIKE :s', { s: `%${filters.search}%` });
      }));
    }

    qb.orderBy('o.createdAt', 'DESC');

    const total = await qb.getCount();
    const orders = await qb.skip((page - 1) * limit).take(limit).getMany();

    deepSanitizeUsers(orders);

    return { items: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product', 'items.variant', 'shippingAddress', 'billingAddress', 'payment', 'shipment', 'statusHistory', 'statusHistory.changedByUser'],
    });
    deepSanitizeUsers(order);
    return order;
  }

  async findByIdOrFail(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repo.findOne({ where: { orderNumber }, relations: ['items', 'shippingAddress'] });
  }

  async findByOrderNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
    const order = await this.repo.findOne({
      where: { orderNumber, guestEmail: email },
      relations: ['items', 'items.product', 'payment', 'shipment', 'statusHistory'],
    });
    return order;
  }

  async findByContact(contact: string): Promise<Order[]> {
    return this.repo.find({
      where: [
        { guestEmail: contact },
        { guestPhone: contact },
      ],
      relations: ['items', 'items.product', 'payment', 'shipment', 'statusHistory'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomerId(customerId: string, filters: OrderFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const where: any = { customerId };
    if (filters.status) where.status = filters.status;

    const [orders, total] = await this.repo.findAndCount({
      where,
      relations: ['items', 'items.product', 'items.product.images', 'shippingAddress', 'shipment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.repo.create(data);
    return this.repo.save(order);
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async countByStatus() {
    return this.repo.createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany();
  }

  async getRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.repo.createQueryBuilder('o')
      .select('SUM(o.total)', 'revenue')
      .where('o.status = :status', { status: 'delivered' })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();
    return Number(result?.revenue || 0);
  }

  async getRevenueByDate(startDate: Date, endDate: Date) {
    return this.repo.createQueryBuilder('o')
      .select('DATE(o.createdAt)', 'date')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .where('o.status = :status', { status: 'delivered' })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('DATE(o.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }
}
