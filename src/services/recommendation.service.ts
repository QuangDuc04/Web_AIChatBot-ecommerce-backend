import { ProductRepository } from '../repositories/product.repository';
import { ProductViewRepository } from '../repositories/productView.repository';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';

export class RecommendationService {
  private productRepo = new ProductRepository();
  private viewRepo = new ProductViewRepository();

  async getRecommendedProducts(customerId: string, limit = 10) {
    // Based on recently viewed categories
    const views = await this.viewRepo.getRecentlyViewed(customerId, 20);
    const categoryIds = [...new Set(views.map(v => v.product?.categoryId).filter(Boolean))];

    if (categoryIds.length) {
      const products = await AppDataSource.getRepository(Product)
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.images', 'images')
        .where('p.categoryId IN (:...cats)', { cats: categoryIds })
        .andWhere('p.isActive = true')
        .orderBy('p.soldCount', 'DESC')
        .take(limit)
        .getMany();
      if (products.length) return products;
    }

    // Fallback: featured + best sellers
    return this.productRepo.findFeatured(limit);
  }

  async getRelatedProducts(productId: string, limit = 6) {
    const product = await this.productRepo.findByIdOrFail(productId);
    return this.productRepo.findRelated(productId, product.categoryId, limit);
  }

  async getFrequentlyBoughtTogether(productId: string, limit = 4) {
    // Step 1: Get product IDs that are frequently ordered alongside this product.
    // Separated from the image join to avoid GROUP BY / aggregate conflict in MySQL strict mode.
    const rows = await AppDataSource.getRepository(Product)
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .innerJoin('order_items', 'oi1', 'oi1.productId = p.id')
      .innerJoin('order_items', 'oi2', 'oi2.orderId = oi1.orderId AND oi2.productId = :pid', { pid: productId })
      .where('p.id != :pid', { pid: productId })
      .andWhere('p.isActive = true')
      .groupBy('p.id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    if (rows.length) {
      const ids = rows.map((r: any) => r.id);
      // Step 2: Fetch full product data with images
      return AppDataSource.getRepository(Product).find({
        where: ids.map((id: string) => ({ id })),
        relations: ['images'],
      });
    }

    // Fallback to related
    return this.getRelatedProducts(productId, limit);
  }

  async getRecentlyViewed(customerId?: string, sessionId?: string, limit = 10) {
    if (!customerId) return [];
    const views = await this.viewRepo.getRecentlyViewed(customerId, limit);
    return views.map(v => v.product).filter(Boolean);
  }

  async getNewArrivals(limit = 10) {
    return AppDataSource.getRepository(Product).find({
      where: { isActive: true },
      relations: ['images', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
