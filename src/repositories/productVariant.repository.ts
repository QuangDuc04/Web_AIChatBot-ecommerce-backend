import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductVariant } from '../entities/ProductVariant';
import { NotFoundError } from '../errors';

export class ProductVariantRepository {
  private repo: Repository<ProductVariant>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductVariant);
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return this.repo.find({ where: { productId } });
  }

  async findById(id: string): Promise<ProductVariant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<ProductVariant> {
    const v = await this.findById(id);
    if (!v) throw new NotFoundError('Không tìm thấy biến thể');
    return v;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async create(data: Partial<ProductVariant>): Promise<ProductVariant> {
    const v = this.repo.create(data);
    return this.repo.save(v);
  }

  async update(id: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.repo.delete({ productId });
  }
}
