import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../../services/shipment.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new ShipmentService();

export class AdminShipmentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllShipments(req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await service.getShipment(req.params.id);
      ResponseUtil.success(res, shipment);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await service.createShipment(req.body, req.user!.id);
      ResponseUtil.created(res, shipment, 'Tạo vận đơn thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await service.updateShipment(req.params.id, req.body, req.user!.id);
      ResponseUtil.success(res, shipment, 'Cập nhật vận đơn thành công');
    } catch (e) { next(e); }
  }

  async addUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const update = await service.addShippingUpdate(req.body, req.user!.id);
      ResponseUtil.created(res, update, 'Thêm cập nhật vận chuyển thành công');
    } catch (e) { next(e); }
  }

  async markDelivered(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await service.markAsDelivered(req.params.id, req.user!.id, req.body.deliveryImages);
      ResponseUtil.success(res, shipment, 'Xác nhận giao hàng thành công');
    } catch (e) { next(e); }
  }

  async markFailed(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await service.markAsFailed(req.params.id, req.user!.id, req.body.failedReason);
      ResponseUtil.success(res, shipment, 'Đã cập nhật giao hàng thất bại');
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getStats();
      ResponseUtil.success(res, stats);
    } catch (e) { next(e); }
  }
}
