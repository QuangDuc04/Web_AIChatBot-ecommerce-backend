import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductView } from '../entities/ProductView';

export class ProductViewRepository {
  private repo: Repository<ProductView>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductView);
  }

  async create(data: Partial<ProductView>): Promise<void> {
    const view = this.repo.create(data);
    await this.repo.save(view);
  }

  async getRecentlyViewed(customerId: string, limit = 10): Promise<ProductView[]> {
    return this.repo.find({
      where: { customerId },
      relations: ['product', 'product.images'],
      order: { viewedAt: 'DESC' },
      take: limit,
    });
  }

  async getPopularProducts(limit = 10) {
    return this.repo
      .createQueryBuilder('v')
      .select('v.productId', 'productId')
      .addSelect('COUNT(*)', 'viewCount')
      .groupBy('v.productId')
      .orderBy('viewCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
