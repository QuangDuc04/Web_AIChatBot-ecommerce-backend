import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../../services/analytics.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new AnalyticsService();

export class AdminAnalyticsController {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getDashboardStats()); } catch (e) { next(e); }
  }
  async revenue(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getRevenueAnalytics(String(req.query.period || '30d'))); } catch (e) { next(e); }
  }
  async products(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getProductAnalytics(String(req.query.period || '30d'), Number(req.query.limit) || 10)); } catch (e) { next(e); }
  }
  async customers(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getCustomerAnalytics(String(req.query.period || '30d'))); } catch (e) { next(e); }
  }
  async orders(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getOrderAnalytics(String(req.query.period || '30d'))); } catch (e) { next(e); }
  }
}
