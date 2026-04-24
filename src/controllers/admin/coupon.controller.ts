import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../../services/coupon.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new CouponService();

export class AdminCouponController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllCoupons({
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await service.getCoupon(req.params.id);
      ResponseUtil.success(res, coupon);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await service.createCoupon(req.body);
      ResponseUtil.created(res, coupon, 'Tạo mã giảm giá thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await service.updateCoupon(req.params.id, req.body);
      ResponseUtil.success(res, coupon, 'Cập nhật mã giảm giá thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteCoupon(req.params.id);
      ResponseUtil.success(res, null, 'Xóa mã giảm giá thành công');
    } catch (e) { next(e); }
  }

  async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const usage = await service.getCouponUsage(req.params.id);
      ResponseUtil.success(res, usage);
    } catch (e) { next(e); }
  }
}
