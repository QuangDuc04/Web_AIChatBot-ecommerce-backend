import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AdminNotification } from '../entities/AdminNotification';

export class AdminNotificationRepository {
  private repo: Repository<AdminNotification>;

  constructor() {
    this.repo = AppDataSource.getRepository(AdminNotification);
  }

  async findAll(userId: string, filters: { page?: number; limit?: number; isRead?: boolean }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const where: any = { userId };
    if (filters.isRead !== undefined) where.isRead = filters.isRead;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { isRead: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async create(data: Partial<AdminNotification>): Promise<AdminNotification> {
    const n = this.repo.create(data);
    return this.repo.save(n);
  }

  async createForAllAdmins(data: Omit<Partial<AdminNotification>, 'userId'>, userIds: string[]): Promise<AdminNotification[]> {
    const entities = userIds.map((userId) => this.repo.create({ ...data, userId }));
    return this.repo.save(entities);
  }

  async markAsRead(id: string): Promise<void> {
    await this.repo.update(id, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async findById(id: string): Promise<AdminNotification | null> {
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
