import { Server } from 'socket.io';

export class NotificationEvents {
  static emitNew(io: Server, userId: string, notification: unknown) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  static emitCount(io: Server, userId: string, unreadCount: number) {
    io.to(`user:${userId}`).emit('notification:count', { unreadCount });
  }
}
