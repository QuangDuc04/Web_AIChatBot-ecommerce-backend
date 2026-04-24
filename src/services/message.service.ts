import { MessageRepository } from '../repositories/message.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationParticipantRepository } from '../repositories/conversationParticipant.repository';
import { MessageReadReceiptRepository } from '../repositories/messageReadReceipt.repository';
import { CloudinaryService } from './cloudinary.service';
import { SendMessageDto, EditMessageDto } from '../dtos/message.dto';
import { AppError } from '../errors';
import { MessageType } from '../types/enums';
import { ActorType } from '../types/jwt.types';

export class MessageService {
  private messageRepo = new MessageRepository();
  private convRepo = new ConversationRepository();
  private participantRepo = new ConversationParticipantRepository();
  private receiptRepo = new MessageReadReceiptRepository();

  async getMessages(conversationId: string, actorId: string, actorType: ActorType, page = 1, limit = 50) {
    const participant = actorType === 'customer'
      ? await this.participantRepo.findByCustomerAndConversation(actorId, conversationId)
      : await this.participantRepo.findByUserAndConversation(actorId, conversationId);
    if (!participant) throw new AppError('Bạn không thuộc cuộc hội thoại này', 403);
    return this.messageRepo.findByConversationId(conversationId, page, limit);
  }

  async sendMessage(actorId: string, actorType: ActorType, dto: SendMessageDto, attachmentFiles?: Express.Multer.File[]) {
    const participant = actorType === 'customer'
      ? await this.participantRepo.findByCustomerAndConversation(actorId, dto.conversationId)
      : await this.participantRepo.findByUserAndConversation(actorId, dto.conversationId);
    if (!participant) throw new AppError('Bạn không thuộc cuộc hội thoại này', 403);

    let attachments: Array<{ url: string; name: string; type: string; size: number }> | undefined;
    if (attachmentFiles?.length) {
      const uploaded = await CloudinaryService.uploadMultipleImages(attachmentFiles, 'chat');
      attachments = uploaded.map((u, i) => ({
        url: u.url,
        name: attachmentFiles[i].originalname,
        type: attachmentFiles[i].mimetype,
        size: attachmentFiles[i].size,
      }));
    }

    const messageData: any = {
      conversationId: dto.conversationId,
      message: dto.message,
      type: dto.type || MessageType.TEXT,
      attachments,
    };

    if (actorType === 'customer') {
      messageData.senderCustomerId = actorId;
    } else {
      messageData.senderUserId = actorId;
    }

    const message = await this.messageRepo.create(messageData);
    await this.convRepo.updateLastMessageAt(dto.conversationId);
    return message;
  }

  async editMessage(messageId: string, actorId: string, actorType: ActorType, dto: EditMessageDto) {
    const message = await this.messageRepo.findByIdOrFail(messageId);

    const isOwner = actorType === 'customer'
      ? message.senderCustomerId === actorId
      : message.senderUserId === actorId;
    if (!isOwner) throw new AppError('Không có quyền sửa tin nhắn này', 403);

    const minutesSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60);
    if (minutesSinceCreation > 15) throw new AppError('Chỉ có thể sửa tin nhắn trong vòng 15 phút', 400);

    return this.messageRepo.update(messageId, { message: dto.message, isEdited: true });
  }

  async deleteMessage(messageId: string, actorId: string, actorType: ActorType) {
    const message = await this.messageRepo.findByIdOrFail(messageId);

    const isOwner = actorType === 'customer'
      ? message.senderCustomerId === actorId
      : message.senderUserId === actorId;
    if (!isOwner) throw new AppError('Không có quyền xóa tin nhắn này', 403);

    await this.messageRepo.softDelete(messageId);
  }

  async markAsRead(actorId: string, actorType: ActorType, conversationId: string) {
    if (actorType === 'customer') {
      await this.participantRepo.updateLastReadAtByCustomer(actorId, conversationId);
    } else {
      await this.participantRepo.updateLastReadAt(actorId, conversationId);
    }
  }
}
