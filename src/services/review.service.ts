import { ReviewRepository } from '../repositories/review.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CloudinaryService } from './cloudinary.service';
import { CreateReviewDto, UpdateReviewDto, ReplyReviewDto } from '../dtos/review.dto';
import { AppError } from '../errors';

/**
 * Strip HTML tags to prevent stored XSS.
 * Keeps only plain text — reviews don't need HTML formatting.
 */
function stripHtml(input: string | undefined | null): string | undefined {
  if (!input) return input as undefined;
  return input
    .replace(/<[^>]*>/g, '')  // remove all HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

export class ReviewService {
  private reviewRepo = new ReviewRepository();
  private productRepo = new ProductRepository();

  async getProductReviews(productId: string, page = 1, limit = 10) {
    return this.reviewRepo.findByProductId(productId, page, limit);
  }

  async getReview(id: string) {
    return this.reviewRepo.findByIdOrFail(id);
  }

  async createReview(customerId: string, dto: CreateReviewDto, imageFiles?: Express.Multer.File[]) {
    // Check product exists
    await this.productRepo.findByIdOrFail(dto.productId);

    // Check if already reviewed this order
    if (dto.orderId) {
      const existing = await this.reviewRepo.findByCustomerAndOrder(customerId, dto.orderId);
      if (existing) throw new AppError('Bạn đã đánh giá đơn hàng này', 400);
    }

    // Upload images
    let images: string[] | undefined;
    if (imageFiles?.length) {
      const uploaded = await CloudinaryService.uploadMultipleImages(imageFiles, 'reviews');
      images = uploaded.map((u) => u.url);
    }

    const review = await this.reviewRepo.create({
      customerId,
      productId: dto.productId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: stripHtml(dto.comment),
      images,
      isVerified: !!dto.orderId,
    });

    return this.reviewRepo.findByIdOrFail(review.id);
  }

  async updateReview(reviewId: string, customerId: string, dto: UpdateReviewDto) {
    const review = await this.reviewRepo.findByIdOrFail(reviewId);

    if (review.customerId !== customerId) {
      throw new AppError('Bạn không có quyền sửa đánh giá này', 403);
    }

    // Check 7 day limit
    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      throw new AppError('Chỉ có thể sửa đánh giá trong vòng 7 ngày', 400);
    }

    const sanitizedDto = { ...dto };
    if (sanitizedDto.comment !== undefined) {
      sanitizedDto.comment = stripHtml(sanitizedDto.comment);
    }
    return this.reviewRepo.update(reviewId, sanitizedDto);
  }

  async deleteReview(reviewId: string, customerId: string, isAdmin: boolean) {
    const review = await this.reviewRepo.findByIdOrFail(reviewId);

    if (!isAdmin && review.customerId !== customerId) {
      throw new AppError('Bạn không có quyền xóa đánh giá này', 403);
    }

    await this.reviewRepo.delete(reviewId);
  }

  async replyToReview(reviewId: string, actorId: string, actorType: 'customer' | 'user', dto: ReplyReviewDto) {
    await this.reviewRepo.findByIdOrFail(reviewId);
    const replyData: any = {
      reviewId,
      comment: stripHtml(dto.comment) || '',
    };
    if (actorType === 'customer') {
      replyData.customerId = actorId;
    } else {
      replyData.userId = actorId;
    }
    return this.reviewRepo.createReply(replyData);
  }

  async deleteReply(replyId: string) {
    await this.reviewRepo.findReplyByIdOrFail(replyId);
    await this.reviewRepo.deleteReply(replyId);
  }

  async markHelpful(reviewId: string) {
    await this.reviewRepo.findByIdOrFail(reviewId);
    await this.reviewRepo.incrementHelpfulCount(reviewId);
  }

  async getProductRatingStats(productId: string) {
    return this.reviewRepo.getProductRatingStats(productId);
  }
}
