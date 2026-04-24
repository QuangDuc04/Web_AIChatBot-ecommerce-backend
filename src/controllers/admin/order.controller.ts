import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new OrderService();

export class AdminOrderController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllOrders(req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await service.getOrder(req.params.id);
      ResponseUtil.success(res, order);
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getOrderStats();
      ResponseUtil.success(res, stats);
    } catch (e) { next(e); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await service.updateOrderStatus(req.params.id, req.body, req.user!.id);
      ResponseUtil.success(res, order, 'Cập nhật trạng thái thành công');
    } catch (e) { next(e); }
  }

  async getRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return ResponseUtil.error(res, 'startDate và endDate là bắt buộc', 400);
      }
      const data = await service.getRevenue(startDate as string, endDate as string);
      ResponseUtil.success(res, data);
    } catch (e) { next(e); }
  }

  async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderIds, status, note } = req.body;
      const results = await service.bulkUpdateStatus(orderIds, status, req.user!.id, note);
      ResponseUtil.success(res, results, 'Cập nhật hàng loạt thành công');
    } catch (e) { next(e); }
  }
}
