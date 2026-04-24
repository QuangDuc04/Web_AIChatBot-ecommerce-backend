import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ResponseUtil } from '../utils/response.util';

const service = new NotificationService();

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getNotifications(req.customer!.id, req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await service.getUnreadCount(req.customer!.id);
      ResponseUtil.success(res, { unreadCount: count });
    } catch (e) { next(e); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAsRead(req.params.id, req.customer!.id);
      ResponseUtil.success(res, null, 'Đã đánh dấu đã đọc');
    } catch (e) { next(e); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAllAsRead(req.customer!.id);
      ResponseUtil.success(res, null, 'Đã đánh dấu tất cả đã đọc');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteNotification(req.params.id, req.customer!.id);
      ResponseUtil.success(res, null, 'Đã xóa thông báo');
    } catch (e) { next(e); }
  }

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await service.getSettings(req.customer!.id);
      ResponseUtil.success(res, settings);
    } catch (e) { next(e); }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await service.updateSettings(req.customer!.id, req.body);
      ResponseUtil.success(res, settings, 'Cập nhật cài đặt thành công');
    } catch (e) { next(e); }
  }
}
