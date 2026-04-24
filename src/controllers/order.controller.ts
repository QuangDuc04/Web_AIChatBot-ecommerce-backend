import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ResponseUtil } from '../utils/response.util';

const service = new OrderService();

export class OrderController {
  async lookupOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, email } = req.query as { orderNumber?: string; email?: string };
      const order = await service.lookupOrder(orderNumber, email);
      ResponseUtil.success(res, order);
    } catch (e) { next(e); }
  }

  async lookupByContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { contact } = req.query as { contact?: string };
      const result = await service.lookupByContact(contact);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }
}
