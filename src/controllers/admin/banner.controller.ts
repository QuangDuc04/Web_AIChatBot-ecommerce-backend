import { Request, Response, NextFunction } from 'express';
import { BannerService } from '../../services/banner.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new BannerService();

export class AdminBannerController {
  async getActive(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getActiveBanners(req.query.placement as any)); } catch (e) { next(e); }
  }
  async getAll(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getAllBanners(req.query as any)); } catch (e) { next(e); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.created(res, await service.createBanner(req.body, req.file), 'Tạo banner thành công'); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.updateBanner(req.params.id, req.body, req.file), 'Cập nhật banner thành công'); } catch (e) { next(e); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await service.deleteBanner(req.params.id); ResponseUtil.success(res, null, 'Xóa banner thành công'); } catch (e) { next(e); }
  }
}
