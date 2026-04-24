import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrderStatusHistory } from '../entities/OrderStatusHistory';

export class OrderStatusHistoryRepository {
  private repo: Repository<OrderStatusHistory>;

  constructor() {
    this.repo = AppDataSource.getRepository(OrderStatusHistory);
  }

  async findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
    return this.repo.find({
      where: { orderId },
      relations: ['changedByUser'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<OrderStatusHistory>): Promise<OrderStatusHistory> {
    const h = this.repo.create(data);
    return this.repo.save(h);
  }
}
