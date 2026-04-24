import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../services/notification.service';
import { AdminNotificationService } from '../../services/adminNotification.service';
import { ResponseUtil } from '../../utils/response.util';
import { getIO } from '../../sockets';
import { NotificationEvents } from '../../sockets/events/notification.events';

const service = new NotificationService();
const adminService = new AdminNotificationService();

export class AdminNotificationController {
  // ── Customer notification management (existing) ──

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const notif = await service.createNotification(req.body);
      try {
        const io = getIO();
        NotificationEvents.emitNew(io, req.body.userId, notif);
        const count = await service.getUnreadCount(req.body.userId);
        NotificationEvents.emitCount(io, req.body.userId, count);
      } catch { /* Socket not initialized */ }
      ResponseUtil.created(res, notif, 'Tạo thông báo thành công');
    } catch (e) { next(e); }
  }

  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await service.createBulkNotifications(req.body);
      try {
        const io = getIO();
        for (const n of notifications) {
          NotificationEvents.emitNew(io, n.customerId, n);
        }
      } catch { /* Socket not initialized */ }
      ResponseUtil.created(res, { count: notifications.length }, 'Gửi thông báo hàng loạt thành công');
    } catch (e) { next(e); }
  }

  // ── Admin's own notifications ──

  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 15;
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const result = await adminService.getNotifications(userId, { page, limit, isRead });
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getMyUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const count = await adminService.getUnreadCount(userId);
      ResponseUtil.success(res, { unreadCount: count });
    } catch (e) { next(e); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await adminService.markAsRead(req.params.id, userId);
      ResponseUtil.success(res, null, 'Đã đánh dấu đã đọc');
    } catch (e) { next(e); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await adminService.markAllAsRead(userId);
      ResponseUtil.success(res, null, 'Đã đánh dấu tất cả đã đọc');
    } catch (e) { next(e); }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await adminService.delete(req.params.id, userId);
      ResponseUtil.success(res, null, 'Đã xóa thông báo');
    } catch (e) { next(e); }
  }
}
