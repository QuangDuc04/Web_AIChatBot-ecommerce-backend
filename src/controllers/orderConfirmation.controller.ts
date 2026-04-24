import { Request, Response, NextFunction } from 'express';
import { OrderConfirmationService } from '../services/orderConfirmation.service';
import { ResponseUtil } from '../utils/response.util';

const service = new OrderConfirmationService();

export class OrderConfirmationController {
  /** GET /api/order-confirm/:token — Get pre-fill data */
  async getByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const confirmation = await service.getByToken(req.params.token);

      // Calculate totals for display
      const subtotal = confirmation.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      ResponseUtil.success(res, {
        customerName: confirmation.customerName,
        customerPhone: confirmation.customerPhone,
        customerEmail: confirmation.customerEmail,
        shippingAddress: confirmation.shippingAddress,
        items: confirmation.items,
        paymentMethod: confirmation.paymentMethod,
        subtotal,
        shippingFee: 0,
        total: subtotal,
        expiresAt: confirmation.expiresAt,
      });
    } catch (e) {
      next(e);
    }
  }

  /** POST /api/order-confirm/:token/confirm — Confirm & create order */
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.confirm(req.params.token);
      ResponseUtil.created(res, result, 'Đặt hàng thành công!');
    } catch (e) {
      next(e);
    }
  }
}
