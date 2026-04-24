import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../../services/news.service';
import { ResponseUtil } from '../../utils/response.util';

const service = new NewsService();

export class AdminNewsController {
  async getActive(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getActiveNews()); } catch (e) { next(e); }
  }
  async getAll(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getAllNews(req.query as any)); } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getNewsById(req.params.id)); } catch (e) { next(e); }
  }
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getNewsBySlug(req.params.slug)); } catch (e) { next(e); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.created(res, await service.createNews(req.body, req.file), 'Tạo bài viết thành công'); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.updateNews(req.params.id, req.body, req.file), 'Cập nhật bài viết thành công'); } catch (e) { next(e); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await service.deleteNews(req.params.id); ResponseUtil.success(res, null, 'Xóa bài viết thành công'); } catch (e) { next(e); }
  }
}
