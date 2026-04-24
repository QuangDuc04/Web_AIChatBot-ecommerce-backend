import { Server, Socket } from 'socket.io';

export class ChatEvents {
  static emitNewMessage(io: Server, conversationId: string, message: unknown) {
    io.to(`conversation:${conversationId}`).emit('message:new', { message, conversationId });
  }

  static emitTyping(socket: Socket, conversationId: string, userId: string, username: string, isTyping: boolean) {
    socket.to(`conversation:${conversationId}`).emit('message:typing', { userId, username, isTyping, conversationId });
  }

  static emitRead(io: Server, conversationId: string, userId: string, messageId: string | null, readAt: Date) {
    io.to(`conversation:${conversationId}`).emit('message:read', { userId, messageId, readAt, conversationId });
  }

  static emitEdited(io: Server, conversationId: string, message: unknown) {
    io.to(`conversation:${conversationId}`).emit('message:edited', { message, conversationId });
  }

  static emitDeleted(io: Server, conversationId: string, messageId: string) {
    io.to(`conversation:${conversationId}`).emit('message:deleted', { messageId, conversationId });
  }

  static emitUserStatus(io: Server, conversationIds: string[], userId: string, isOnline: boolean, lastSeenAt: Date | null) {
    for (const cid of conversationIds) {
      io.to(`conversation:${cid}`).emit('conversation:user_status', { userId, isOnline, lastSeenAt });
    }
  }
}
