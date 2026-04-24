import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../services/shipment.service';
import { ResponseUtil } from '../utils/response.util';

const service = new ShipmentService();

export class ShipmentController {
  async trackShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.trackShipment(req.user!.id, req.params.orderId);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }
}
