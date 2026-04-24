import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../../services/settings.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new SettingsService();

export class AdminSettingsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getAllSettings(req.query.category as string)); } catch (e) { next(e); }
  }
  async getOne(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getSetting(req.params.key)); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.updateSetting(req.params.key, req.body.value, req.user!.id, req.body.category, req.body.description), 'Cập nhật cài đặt thành công'); } catch (e) { next(e); }
  }
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.bulkUpdateSettings(req.body.settings, req.user!.id), 'Cập nhật thành công'); } catch (e) { next(e); }
  }
}
