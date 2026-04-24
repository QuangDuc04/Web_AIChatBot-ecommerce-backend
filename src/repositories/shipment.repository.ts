import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Shipment } from '../entities/Shipment';
import { NotFoundError } from '../errors';
import { ShipmentFilterDto } from '../dtos/shipment.dto';
import { deepSanitizeUsers } from '../utils/sanitize.util';

export class ShipmentRepository {
  private repo: Repository<Shipment>;

  constructor() {
    this.repo = AppDataSource.getRepository(Shipment);
  }

  async findAll(filters: ShipmentFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const qb = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.order', 'order')
      .leftJoinAndSelect('order.customer', 'customer');

    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    qb.orderBy('s.createdAt', 'DESC');

    const total = await qb.getCount();
    const shipments = await qb.skip((page - 1) * limit).take(limit).getMany();
    deepSanitizeUsers(shipments);
    return { items: shipments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Shipment | null> {
    return this.repo.findOne({ where: { id }, relations: ['order', 'updates'] });
  }

  async findByIdOrFail(id: string): Promise<Shipment> {
    const s = await this.findById(id);
    if (!s) throw new NotFoundError('Không tìm thấy vận đơn');
    return s;
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    return this.repo.findOne({ where: { orderId }, relations: ['updates'] });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    return this.repo.findOne({ where: { trackingNumber }, relations: ['updates'] });
  }

  async create(data: Partial<Shipment>): Promise<Shipment> {
    const s = this.repo.create(data);
    return this.repo.save(s);
  }

  async update(id: string, data: Partial<Shipment>): Promise<Shipment> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async getStats() {
    return this.repo.createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();
  }
}
