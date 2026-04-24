import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { ResponseUtil } from '../utils/response.util';

const service = new PaymentService();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export class PaymentController {
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await service.createPayment(req.body.orderId, req.body.method, ipAddress);
      ResponseUtil.success(res, result, 'Tạo thanh toán thành công');
    } catch (e) { next(e); }
  }

  async vnpayReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.processVNPayReturn(req.query as Record<string, string>);
      const status = result.success ? 'success' : 'failed';
      res.redirect(`${CLIENT_URL}/order/payment-result?status=${status}&orderId=${result.orderId}`);
    } catch (e) {
      res.redirect(`${CLIENT_URL}/order/payment-result?status=error`);
    }
  }

  async vnpayIPN(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await service.processVNPayIPN(req.query as Record<string, string>);
      res.json(result);
    } catch {
      res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  async momoReturn(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await service.processMomoReturn(req.query as Record<string, string>);
      const status = result.success ? 'success' : 'failed';
      res.redirect(`${CLIENT_URL}/order/payment-result?status=${status}&orderId=${result.orderId}`);
    } catch {
      res.redirect(`${CLIENT_URL}/order/payment-result?status=error`);
    }
  }

  async momoNotify(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await service.processMomoNotify(req.body);
      res.json(result);
    } catch {
      res.json({ resultCode: 1, message: 'Error' });
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await service.getPaymentStatus(req.params.orderId);
      ResponseUtil.success(res, payment);
    } catch (e) { next(e); }
  }
}
