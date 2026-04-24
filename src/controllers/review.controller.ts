import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { ResponseUtil } from '../utils/response.util';

const service = new ReviewService();

export class ReviewController {
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await service.getProductReviews(req.params.productId, page, limit);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await service.getReview(req.params.id);
      ResponseUtil.success(res, review);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const review = await service.createReview(req.customer!.id, req.body, files);
      ResponseUtil.created(res, review, 'Đánh giá thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await service.updateReview(req.params.id, req.customer!.id, req.body);
      ResponseUtil.success(res, review, 'Cập nhật đánh giá thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteReview(req.params.id, req.customer!.id, false);
      ResponseUtil.success(res, null, 'Xóa đánh giá thành công');
    } catch (e) { next(e); }
  }

  async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const reply = await service.replyToReview(req.params.id, req.user!.id, 'user', req.body);
      ResponseUtil.created(res, reply, 'Phản hồi thành công');
    } catch (e) { next(e); }
  }

  async deleteReply(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteReply(req.params.replyId);
      ResponseUtil.success(res, null, 'Xóa phản hồi thành công');
    } catch (e) { next(e); }
  }

  async markHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markHelpful(req.params.id);
      ResponseUtil.success(res, null, 'Đã đánh dấu hữu ích');
    } catch (e) { next(e); }
  }

  async getRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getProductRatingStats(req.params.productId);
      ResponseUtil.success(res, stats);
    } catch (e) { next(e); }
  }
}
