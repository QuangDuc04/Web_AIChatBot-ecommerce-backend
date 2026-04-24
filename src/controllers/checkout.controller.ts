import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkout.service';
import { ResponseUtil } from '../utils/response.util';

const service = new CheckoutService();

export class CheckoutController {
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.validateCheckout(req.body.items || []);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.calculateCheckout(req.body);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const device = req.headers['user-agent'];
      const order = await service.createOrder(req.body, ipAddress, device);
      ResponseUtil.created(res, order, 'Đặt hàng thành công');
    } catch (e) { next(e); }
  }
}
