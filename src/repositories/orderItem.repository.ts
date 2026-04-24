import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrderItem } from '../entities/OrderItem';

export class OrderItemRepository {
  private repo: Repository<OrderItem>;

  constructor() {
    this.repo = AppDataSource.getRepository(OrderItem);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.repo.find({ where: { orderId }, relations: ['product', 'variant'] });
  }

  async create(data: Partial<OrderItem>): Promise<OrderItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async createMany(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
    const entities = this.repo.create(items);
    return this.repo.save(entities);
  }
}
