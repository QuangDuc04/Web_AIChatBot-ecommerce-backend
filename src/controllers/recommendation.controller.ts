import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { ResponseUtil } from '../utils/response.util';

const service = new RecommendationService();

export class RecommendationController {
  async recommended(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getRecommendedProducts(req.customer!.id)); } catch (e) { next(e); }
  }
  async related(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getRelatedProducts(req.params.productId)); } catch (e) { next(e); }
  }
  async frequentlyBought(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getFrequentlyBoughtTogether(req.params.productId)); } catch (e) { next(e); }
  }
  async recentlyViewed(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getRecentlyViewed(req.customer?.id)); } catch (e) { next(e); }
  }
  async newArrivals(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getNewArrivals()); } catch (e) { next(e); }
  }
}
