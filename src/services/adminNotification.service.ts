import { AdminNotificationRepository } from '../repositories/adminNotification.repository';
import { UserRepository } from '../repositories/user.repository';
import { AdminNotificationType, UserRole } from '../types/enums';
import { AppError } from '../errors';
import { getIO } from '../sockets';

const repo = new AdminNotificationRepository();
const userRepo = new UserRepository();

export class AdminNotificationService {

  async getNotifications(userId: string, filters: { page?: number; limit?: number; isRead?: boolean }) {
    return repo.findAll(userId, filters);
  }

  async getUnreadCount(userId: string) {
    return repo.countUnread(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notif = await repo.findById(id);
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    if (notif.userId !== userId) throw new AppError('Không có quyền', 403);
    await repo.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    await repo.markAllAsRead(userId);
  }

  async delete(id: string, userId: string) {
    const notif = await repo.findById(id);
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    if (notif.userId !== userId) throw new AppError('Không có quyền', 403);
    await repo.delete(id);
  }

  /**
   * Create notification for all admin/staff users and emit via socket
   */
  async notifyAllAdmins(data: {
    type: AdminNotificationType;
    title: string;
    message: string;
    url?: string;
    data?: Record<string, unknown>;
  }) {
    try {
      const adminIds = await userRepo.findIdsByRole(UserRole.ADMIN);
      const staffIds = await userRepo.findIdsByRole(UserRole.STAFF);
      const allIds = [...new Set([...adminIds, ...staffIds])];
      if (!allIds.length) return;

      const notifications = await repo.createForAllAdmins(data, allIds);

      // Emit socket events
      try {
        const io = getIO();
        for (const notif of notifications) {
          io.to(`user:${notif.userId}`).emit('notification:new', { notification: notif });
          const count = await repo.countUnread(notif.userId);
          io.to(`user:${notif.userId}`).emit('notification:count', { unreadCount: count });
        }
      } catch { /* socket not ready */ }

      return notifications;
    } catch (e) {
      console.error('Failed to create admin notifications:', e);
    }
  }
}
