import { IsNull, LessThanOrEqual, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Banner } from '../entities/Banner';
import { NotFoundError } from '../errors';
import { BannerPlacement } from '../types/enums';

export class BannerRepository {
  private repo: Repository<Banner>;

  constructor() {
    this.repo = AppDataSource.getRepository(Banner);
  }

  async findAll(filters?: { placement?: BannerPlacement; isActive?: boolean; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = {};
    if (filters?.placement) where.placement = filters.placement;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [banners, total] = await this.repo.findAndCount({
      where, order: { displayOrder: 'ASC' }, skip: (page - 1) * limit, take: limit,
    });
    return { items: banners, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findActive(placement?: BannerPlacement): Promise<Banner[]> {
    const now = new Date();
    const where: any = {
      isActive: true,
      startDate: Or(IsNull(), LessThanOrEqual(now)),
      endDate: Or(IsNull(), MoreThanOrEqual(now)),
    };
    if (placement) where.placement = placement;
    return this.repo.find({ where, order: { displayOrder: 'ASC' } });
  }

  async findByIdOrFail(id: string): Promise<Banner> {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundError('Không tìm thấy banner');
    return b;
  }

  async create(data: Partial<Banner>): Promise<Banner> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Banner>): Promise<Banner> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
