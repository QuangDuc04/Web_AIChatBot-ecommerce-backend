import { Request, Response, NextFunction } from 'express';
import { FlashSaleService } from '../services/flashSale.service';
import { ResponseUtil } from '../utils/response.util';

const service = new FlashSaleService();

export class FlashSaleController {
  async getActive(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getActiveFlashSales()); } catch (e) { next(e); }
  }
  async getOne(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getFlashSale(req.params.id)); } catch (e) { next(e); }
  }
}
