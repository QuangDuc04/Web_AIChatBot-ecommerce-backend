import { Socket, Server } from 'socket.io';
import { GuestChatService } from '../../services/guestChat.service';

const guestChatService = new GuestChatService();

export function handleGuestChat(socket: Socket, io: Server) {
  const conversationId = socket.data.guestConversationId;
  if (!conversationId) return;

  // Auto-join conversation room
  socket.join(`conversation:${conversationId}`);

  // Notify admin that guest is online
  io.to('orders').emit('guest:online', { conversationId });

  // Guest sends a message via socket
  socket.on('message:send', async (data: { message: string }) => {
    try {
      if (!data.message?.trim()) return;
      const msg = await guestChatService.sendGuestMessage(conversationId, data.message);
      socket.emit('message:sent', msg);
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });

  // Guest typing indicator
  socket.on('message:typing', (data: { isTyping: boolean }) => {
    socket.to(`conversation:${conversationId}`).emit('message:typing', {
      conversationId,
      userId: 'guest',
      userName: 'Khách',
      isTyping: data.isTyping,
    });
  });

  // Guest disconnect → notify admin
  socket.on('disconnect', () => {
    io.to('orders').emit('guest:offline', { conversationId });
  });
}
