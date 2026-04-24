import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../services/coupon.service';
import { ResponseUtil } from '../utils/response.util';

const service = new CouponService();

export class CouponController {
  async getActiveCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await service.getActiveCoupons();
      ResponseUtil.success(res, coupons);
    } catch (e) { next(e); }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.validateCoupon(req.body.code, req.customer?.id, req.body.subtotal);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }
}
