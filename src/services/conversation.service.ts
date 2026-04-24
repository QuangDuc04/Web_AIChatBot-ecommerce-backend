import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationParticipantRepository } from '../repositories/conversationParticipant.repository';
import { MessageRepository } from '../repositories/message.repository';
import { CreateConversationDto, ConversationFilterDto } from '../dtos/conversation.dto';
import { AppError } from '../errors';
import { ConversationStatus, ConversationType, ParticipantRole, MessageType } from '../types/enums';

export class ConversationService {
  private convRepo = new ConversationRepository();
  private participantRepo = new ConversationParticipantRepository();
  private messageRepo = new MessageRepository();

  // Customer
  async getMyConversations(customerId: string, filters: ConversationFilterDto) {
    const convIds = await this.participantRepo.getCustomerConversationIds(customerId);
    if (!convIds.length) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

    const result = await this.convRepo.findAll(filters);
    result.items = result.items.filter(c => convIds.includes(c.id));
    return result;
  }

  async getConversation(conversationId: string, customerId: string) {
    const conv = await this.convRepo.findByIdOrFail(conversationId);
    const participant = await this.participantRepo.findByCustomerAndConversation(customerId, conversationId);
    if (!participant) throw new AppError('Bạn không thuộc cuộc hội thoại này', 403);

    await this.participantRepo.updateLastReadAtByCustomer(customerId, conversationId);
    const messages = await this.messageRepo.findByConversationId(conversationId);
    return { ...conv, messages: messages.items };
  }

  async createConversation(customerId: string, dto: CreateConversationDto) {
    const conv = await this.convRepo.create({
      type: dto.type,
      orderId: dto.orderId,
      status: ConversationStatus.OPEN,
      lastMessageAt: new Date(),
    });

    // Add customer as participant
    await this.participantRepo.create({
      conversationId: conv.id,
      customerId,
      role: ParticipantRole.CUSTOMER,
    });

    // Create initial message
    await this.messageRepo.create({
      conversationId: conv.id,
      senderCustomerId: customerId,
      message: dto.initialMessage,
      type: MessageType.TEXT,
    });

    return this.convRepo.findByIdOrFail(conv.id);
  }

  async closeConversation(conversationId: string, customerId: string) {
    const participant = await this.participantRepo.findByCustomerAndConversation(customerId, conversationId);
    if (!participant) throw new AppError('Bạn không thuộc cuộc hội thoại này', 403);

    return this.convRepo.update(conversationId, { status: ConversationStatus.CLOSED });
  }

  // Admin

  async getConversationForAdmin(conversationId: string) {
    const conv = await this.convRepo.findByIdOrFail(conversationId);
    const messages = await this.messageRepo.findByConversationId(conversationId);
    return { ...conv, messages: messages.items };
  }

  async closeConversationByAdmin(conversationId: string) {
    await this.convRepo.findByIdOrFail(conversationId);
    return this.convRepo.update(conversationId, { status: ConversationStatus.CLOSED });
  }

  async reopenConversation(conversationId: string) {
    const conv = await this.convRepo.findByIdOrFail(conversationId);
    if (conv.status !== ConversationStatus.CLOSED) {
      throw new AppError('Chỉ có thể mở lại cuộc hội thoại đã đóng', 400);
    }
    return this.convRepo.update(conversationId, { status: ConversationStatus.OPEN });
  }

  async getAllConversations(filters: ConversationFilterDto) {
    return this.convRepo.findAll(filters);
  }

  async assignConversation(conversationId: string, staffId: string) {
    await this.convRepo.findByIdOrFail(conversationId);

    const existing = await this.participantRepo.findByUserAndConversation(staffId, conversationId);
    if (!existing) {
      await this.participantRepo.create({
        conversationId,
        userId: staffId,
        role: ParticipantRole.STAFF,
      });
    }

    // System message
    await this.messageRepo.create({
      conversationId,
      senderUserId: staffId,
      message: 'Nhân viên đã tham gia cuộc hội thoại',
      type: MessageType.SYSTEM,
    });

    await this.convRepo.updateLastMessageAt(conversationId);
    return this.convRepo.findByIdOrFail(conversationId);
  }

  async getStats() {
    const openCount = await this.convRepo.countOpen();
    return { openConversations: openCount };
  }
}
