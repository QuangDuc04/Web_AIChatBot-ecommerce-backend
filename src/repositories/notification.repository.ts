import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { NotFoundError } from '../errors';
import { NotificationFilterDto } from '../dtos/notification.dto';

export class NotificationRepository {
  private repo: Repository<Notification>;

  constructor() {
    this.repo = AppDataSource.getRepository(Notification);
  }

  async findAll(customerId: string, filters: NotificationFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const where: any = { customerId };
    if (filters.type) where.type = filters.type;
    if (filters.isRead !== undefined) where.isRead = filters.isRead;

    const [notifications, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  async countUnread(customerId: string): Promise<number> {
    return this.repo.count({ where: { customerId, isRead: false } });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const n = this.repo.create(data);
    return this.repo.save(n);
  }

  async createMany(items: Partial<Notification>[]): Promise<Notification[]> {
    const entities = this.repo.create(items);
    return this.repo.save(entities);
  }

  async markAsRead(id: string): Promise<void> {
    await this.repo.update(id, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(customerId: string): Promise<void> {
    await this.repo.update({ customerId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
