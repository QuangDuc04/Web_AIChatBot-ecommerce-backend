import { Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { News } from '../entities/News';
import { NotFoundError } from '../errors';

export class NewsRepository {
  private repo: Repository<News>;

  constructor() {
    this.repo = AppDataSource.getRepository(News);
  }

  async findAll(filters?: { isActive?: boolean; search?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) where.title = Like(`%${filters.search}%`);

    const [news, total] = await this.repo.findAndCount({
      where, order: { displayOrder: 'ASC', createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit,
    });
    return { items: news, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findActive(): Promise<News[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      take: 7,
    });
  }

  async findBySlug(slug: string): Promise<News | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async findByIdOrFail(id: string): Promise<News> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundError('Không tìm thấy bài viết');
    return item;
  }

  async create(data: Partial<News>): Promise<News> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<News>): Promise<News> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
