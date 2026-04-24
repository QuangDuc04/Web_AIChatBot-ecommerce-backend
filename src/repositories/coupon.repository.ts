import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Coupon } from '../entities/Coupon';
import { NotFoundError } from '../errors';

export class CouponRepository {
  private repo: Repository<Coupon>;

  constructor() {
    this.repo = AppDataSource.getRepository(Coupon);
  }

  async findAll(filters?: { isActive?: boolean; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [coupons, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: coupons, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Coupon> {
    const c = await this.findById(id);
    if (!c) throw new NotFoundError('Không tìm thấy coupon');
    return c;
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const c = this.repo.create(data);
    return this.repo.save(c);
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async incrementUsedCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'usedCount', 1);
  }

  async findActive(): Promise<Coupon[]> {
    const now = new Date();
    return this.repo.find({
      where: {
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { endDate: 'ASC' },
    });
  }
}
