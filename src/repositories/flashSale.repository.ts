import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { FlashSale } from '../entities/FlashSale';
import { NotFoundError } from '../errors';

export class FlashSaleRepository {
  private repo: Repository<FlashSale>;

  constructor() {
    this.repo = AppDataSource.getRepository(FlashSale);
  }

  async findAll(filters?: { isActive?: boolean; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [sales, total] = await this.repo.findAndCount({
      where,
      relations: ['items', 'items.product', 'items.product.images'],
      order: { startDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: sales, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findActive(): Promise<FlashSale[]> {
    const now = new Date();
    return this.repo.find({
      where: { isActive: true, startDate: LessThanOrEqual(now), endDate: MoreThanOrEqual(now) },
      relations: ['items', 'items.product', 'items.product.images'],
      order: { endDate: 'ASC' },
    });
  }

  async findById(id: string): Promise<FlashSale | null> {
    return this.repo.findOne({ where: { id }, relations: ['items', 'items.product', 'items.product.images', 'items.variant'] });
  }

  async findByIdOrFail(id: string): Promise<FlashSale> {
    const s = await this.findById(id);
    if (!s) throw new NotFoundError('Không tìm thấy Flash Sale');
    return s;
  }

  async create(data: Partial<FlashSale>): Promise<FlashSale> {
    const s = this.repo.create(data);
    return this.repo.save(s);
  }

  async update(id: string, data: Partial<FlashSale>): Promise<FlashSale> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
