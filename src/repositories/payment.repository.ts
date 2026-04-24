import { Brackets, LessThan, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Payment } from '../entities/Payment';
import { NotFoundError } from '../errors';
import { PaymentFilterDto } from '../dtos/payment.dto';
import { PaymentStatus } from '../types/enums';

export class PaymentRepository {
  private repo: Repository<Payment>;

  constructor() {
    this.repo = AppDataSource.getRepository(Payment);
  }

  async findAll(filters: PaymentFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.order', 'order');

    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.method) qb.andWhere('p.method = :method', { method: filters.method });
    if (filters.startDate) qb.andWhere('p.createdAt >= :start', { start: filters.startDate });
    if (filters.endDate) qb.andWhere('p.createdAt <= :end', { end: filters.endDate });

    qb.orderBy('p.createdAt', 'DESC');
    const total = await qb.getCount();
    const payments = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { items: payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id }, relations: ['order'] });
  }

  async findByIdOrFail(id: string): Promise<Payment> {
    const p = await this.findById(id);
    if (!p) throw new NotFoundError('Không tìm thấy thanh toán');
    return p;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { orderId }, relations: ['order'] });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { transactionId } });
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    const p = this.repo.create(data);
    return this.repo.save(p);
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async getPendingPayments(olderThanMinutes = 15): Promise<Payment[]> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    return this.repo.find({
      where: { status: PaymentStatus.PENDING, createdAt: LessThan(cutoff) },
      relations: ['order'],
    });
  }

  async getRevenueByMethod(startDate: Date, endDate: Date) {
    return this.repo.createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('SUM(p.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.status = :s', { s: PaymentStatus.COMPLETED })
      .andWhere('p.paidAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('p.method')
      .getRawMany();
  }
}
