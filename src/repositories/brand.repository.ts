import { Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Brand } from '../entities/Brand';
import { NotFoundError } from '../errors';

export class BrandRepository {
  private repo: Repository<Brand>;

  constructor() {
    this.repo = AppDataSource.getRepository(Brand);
  }

  async findAll(filters?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) where.name = Like(`%${filters.search}%`);

    const [brands, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: brands, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Brand | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Brand> {
    const brand = await this.findById(id);
    if (!brand) throw new NotFoundError('Không tìm thấy thương hiệu');
    return brand;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(data: Partial<Brand>): Promise<Brand> {
    const brand = this.repo.create(data);
    return this.repo.save(brand);
  }

  async update(id: string, data: Partial<Brand>): Promise<Brand> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async hasProducts(id: string): Promise<boolean> {
    const brand = await this.repo.findOne({ where: { id }, relations: ['products'] });
    return (brand?.products?.length ?? 0) > 0;
  }
}
