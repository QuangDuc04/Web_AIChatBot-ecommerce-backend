import { Socket, Server } from 'socket.io';
import { NotificationService } from '../../services/notification.service';

const notifService = new NotificationService();

export function handleNotifications(socket: Socket, io: Server) {
  const user = socket.data.user;
  if (!user) return;

  socket.on('notification:mark_read', async (data: { notificationId: string }) => {
    try {
      await notifService.markAsRead(data.notificationId, user.id);
      const count = await notifService.getUnreadCount(user.id);
      io.to(`user:${user.id}`).emit('notification:count', { unreadCount: count });
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });

  socket.on('notification:mark_all_read', async () => {
    try {
      await notifService.markAllAsRead(user.id);
      io.to(`user:${user.id}`).emit('notification:count', { unreadCount: 0 });
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });
}
