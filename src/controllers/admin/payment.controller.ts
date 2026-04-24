import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment.service';
import { RefundService } from '../../services/refund.service';
import { ResponseUtil } from '../../utils/response.util';

const paymentService = new PaymentService();
const refundService = new RefundService();

export class AdminPaymentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getAllPayments(req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.getPayment(req.params.id);
      ResponseUtil.success(res, payment);
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await paymentService.getPaymentStats(
        req.query.startDate as string,
        req.query.endDate as string,
      );
      ResponseUtil.success(res, stats);
    } catch (e) { next(e); }
  }

  async confirmCOD(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.confirmCODPayment(req.params.orderId, req.user!.id);
      ResponseUtil.success(res, payment, 'Xác nhận thanh toán COD thành công');
    } catch (e) { next(e); }
  }

  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await refundService.createRefund(
        req.params.id, req.body.amount, req.body.reason, req.user!.id,
      );
      ResponseUtil.success(res, result, 'Hoàn tiền thành công');
    } catch (e) { next(e); }
  }
}
