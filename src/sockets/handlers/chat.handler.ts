import { Socket, Server } from 'socket.io';
import { MessageService } from '../../services/message.service';
import { ConversationParticipantRepository } from '../../repositories/conversationParticipant.repository';
import { ChatEvents } from '../events/chat.events';
import { MessageType } from '../../types/enums';
import { ActorType } from '../../types/jwt.types';

const messageService = new MessageService();
const participantRepo = new ConversationParticipantRepository();

export function handleChat(socket: Socket, io: Server) {
  // Support both customer and admin/staff actors
  const customer = socket.data.customer;
  const user = socket.data.user;
  const actor = customer || user;
  if (!actor) return;

  const actorType: ActorType = customer ? 'customer' : 'user';
  const actorId: string = actor.id;
  const actorName = `${actor.firstName} ${actor.lastName}`;

  socket.on('conversation:join', async (data: { conversationId: string }) => {
    try {
      const participant = actorType === 'customer'
        ? await participantRepo.findByCustomerAndConversation(actorId, data.conversationId)
        : await participantRepo.findByUserAndConversation(actorId, data.conversationId);
      if (!participant) return socket.emit('error', { message: 'Không có quyền' });

      socket.join(`conversation:${data.conversationId}`);
      await messageService.markAsRead(actorId, actorType, data.conversationId);
      socket.emit('conversation:joined', { conversationId: data.conversationId });
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });

  socket.on('conversation:leave', (data: { conversationId: string }) => {
    socket.leave(`conversation:${data.conversationId}`);
  });

  socket.on('message:send', async (data: { conversationId: string; message: string; type?: MessageType }) => {
    try {
      const msg = await messageService.sendMessage(actorId, actorType, {
        conversationId: data.conversationId,
        message: data.message,
        type: data.type,
      });
      ChatEvents.emitNewMessage(io, data.conversationId, msg);
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });

  socket.on('message:typing', (data: { conversationId: string; isTyping: boolean }) => {
    ChatEvents.emitTyping(socket, data.conversationId, actorId, actorName, data.isTyping);
  });

  socket.on('message:read', async (data: { conversationId: string; messageId?: string }) => {
    try {
      await messageService.markAsRead(actorId, actorType, data.conversationId);
      ChatEvents.emitRead(io, data.conversationId, actorId, data.messageId || null, new Date());
    } catch (e: any) {
      socket.emit('error', { message: e.message });
    }
  });
}
