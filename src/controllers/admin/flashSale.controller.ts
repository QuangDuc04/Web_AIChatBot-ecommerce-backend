import { Request, Response, NextFunction } from 'express';
import { FlashSaleService } from '../../services/flashSale.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new FlashSaleService();

export class AdminFlashSaleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getAllFlashSales(req.query as any)); } catch (e) { next(e); }
  }
  async getOne(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getFlashSale(req.params.id)); } catch (e) { next(e); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.created(res, await service.createFlashSale(req.body), 'Tạo Flash Sale thành công'); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.updateFlashSale(req.params.id, req.body), 'Cập nhật Flash Sale thành công'); } catch (e) { next(e); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await service.deleteFlashSale(req.params.id); ResponseUtil.success(res, null, 'Xóa Flash Sale thành công'); } catch (e) { next(e); }
  }
  async addItem(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.created(res, await service.addFlashSaleItem(req.params.flashSaleId, req.body), 'Thêm sản phẩm thành công'); } catch (e) { next(e); }
  }
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.updateFlashSaleItem(req.params.itemId, req.body)); } catch (e) { next(e); }
  }
  async removeItem(req: Request, res: Response, next: NextFunction) {
    try { await service.removeFlashSaleItem(req.params.itemId); ResponseUtil.success(res, null, 'Đã xóa sản phẩm'); } catch (e) { next(e); }
  }
}
