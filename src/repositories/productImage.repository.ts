import { Not, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductImage } from '../entities/ProductImage';
import { NotFoundError } from '../errors';

export class ProductImageRepository {
  private repo: Repository<ProductImage>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductImage);
  }

  async findByProductId(productId: string): Promise<ProductImage[]> {
    return this.repo.find({
      where: { productId },
      order: { displayOrder: 'ASC' },
    });
  }

  async findPrimaryImage(productId: string): Promise<ProductImage | null> {
    return this.repo.findOne({ where: { productId, isPrimary: true } });
  }

  async findByIdOrFail(id: string): Promise<ProductImage> {
    const img = await this.repo.findOne({ where: { id } });
    if (!img) throw new NotFoundError('Không tìm thấy ảnh');
    return img;
  }

  async create(data: Partial<ProductImage>): Promise<ProductImage> {
    const img = this.repo.create(data);
    return this.repo.save(img);
  }

  async createMany(items: Partial<ProductImage>[]): Promise<ProductImage[]> {
    const images = this.repo.create(items);
    return this.repo.save(images);
  }

  async update(id: string, data: Partial<ProductImage>): Promise<ProductImage> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async setPrimary(id: string, productId: string): Promise<void> {
    await this.repo.update({ productId, isPrimary: true, id: Not(id) }, { isPrimary: false } as any);
    await this.repo.update(id, { isPrimary: true });
  }

  async deleteByProductId(productId: string): Promise<ProductImage[]> {
    const images = await this.findByProductId(productId);
    if (images.length) await this.repo.delete({ productId });
    return images;
  }
}
