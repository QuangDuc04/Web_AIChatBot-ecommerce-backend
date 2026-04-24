import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductReview } from '../entities/ProductReview';
import { ReviewReply } from '../entities/ReviewReply';
import { NotFoundError } from '../errors';
import { deepSanitizeUsers } from '../utils/sanitize.util';

export class ReviewRepository {
  private repo: Repository<ProductReview>;
  private replyRepo: Repository<ReviewReply>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductReview);
    this.replyRepo = AppDataSource.getRepository(ReviewReply);
  }

  async findByProductId(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await this.repo.findAndCount({
      where: { productId },
      relations: ['customer', 'replies', 'replies.customer', 'replies.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Strip all sensitive user fields (password, tokens, etc.)
    deepSanitizeUsers(reviews);

    return { items: reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<ProductReview | null> {
    const review = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'product', 'replies', 'replies.customer', 'replies.user'],
    });
    deepSanitizeUsers(review);
    return review;
  }

  async findByIdOrFail(id: string): Promise<ProductReview> {
    const review = await this.findById(id);
    if (!review) throw new NotFoundError('Không tìm thấy đánh giá');
    return review;
  }

  async findByCustomerAndOrder(customerId: string, orderId: string): Promise<ProductReview | null> {
    return this.repo.findOne({ where: { customerId, orderId } });
  }

  async create(data: Partial<ProductReview>): Promise<ProductReview> {
    const review = this.repo.create(data);
    return this.repo.save(review);
  }

  async update(id: string, data: Partial<ProductReview>): Promise<ProductReview> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async incrementHelpfulCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'helpfulCount', 1);
  }

  async getProductAverageRating(productId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.productId = :productId', { productId })
      .getRawOne();
    return result?.avg ? parseFloat(Number(result.avg).toFixed(1)) : 0;
  }

  async getProductRatingStats(productId: string) {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :productId', { productId })
      .groupBy('r.rating')
      .getRawMany();

    const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalCount = 0;
    let totalSum = 0;
    result.forEach((row) => {
      const rating = Number(row.rating);
      const count = Number(row.count);
      stats[rating] = count;
      totalCount += count;
      totalSum += rating * count;
    });

    return {
      average: totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(1)) : 0,
      total: totalCount,
      distribution: stats,
    };
  }

  // Reply
  async createReply(data: Partial<ReviewReply>): Promise<ReviewReply> {
    const reply = this.replyRepo.create(data);
    return this.replyRepo.save(reply);
  }

  async findReplyByIdOrFail(id: string): Promise<ReviewReply> {
    const reply = await this.replyRepo.findOne({ where: { id } });
    if (!reply) throw new NotFoundError('Không tìm thấy phản hồi');
    return reply;
  }

  async deleteReply(id: string): Promise<void> {
    await this.replyRepo.delete(id);
  }
}
