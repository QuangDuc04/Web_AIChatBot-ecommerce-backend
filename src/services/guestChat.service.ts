import { Repository, IsNull, Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { ConversationStatus, ConversationType, MessageType } from '../types/enums';
import { AppError, NotFoundError } from '../errors';
import { getIO } from '../sockets';

const AUTO_REPLY_DELAY_MS = 2 * 60 * 1000; // 2 minutes
const AUTO_REPLY_MESSAGE = `Cảm ơn bạn đã liên hệ với chúng tôi! 😊 Tin nhắn của bạn đã được ghi nhận, đội ngũ tư vấn sẽ phản hồi trong thời gian sớm nhất. Nếu cần hỗ trợ gấp, vui lòng gọi hotline: 0347.366.345. Chúc bạn một ngày tuyệt vời! 🌿`;

// Track pending auto-reply timers to avoid duplicates
const autoReplyTimers = new Map<string, NodeJS.Timeout>();

export class GuestChatService {
  private convRepo: Repository<Conversation>;
  private msgRepo: Repository<Message>;

  constructor() {
    this.convRepo = AppDataSource.getRepository(Conversation);
    this.msgRepo = AppDataSource.getRepository(Message);
  }

  /**
   * Start a new guest chat conversation.
   */
  async startConversation(data: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
    ipAddress?: string;
    device?: string;
  }): Promise<{ conversation: Conversation; messages: Message[] }> {
    const conv = this.convRepo.create({
      type: ConversationType.CUSTOMER_SUPPORT,
      status: ConversationStatus.OPEN,
      guestName: data.name,
      guestPhone: data.phone,
      guestEmail: data.email || null,
      guestIpAddress: data.ipAddress || null,
      guestDevice: data.device || null,
      lastMessageAt: new Date(),
    } as Partial<Conversation>);
    await this.convRepo.save(conv);

    const messages: Message[] = [];

    // System welcome message
    const welcome = this.msgRepo.create({
      conversationId: conv.id,
      message: `Xin chào ${data.name}! 👋 Rất vui được hỗ trợ bạn. Hãy để lại câu hỏi, đội ngũ tư vấn sẽ phản hồi ngay nhé!`,
      type: MessageType.SYSTEM,
    });
    await this.msgRepo.save(welcome);
    messages.push(welcome);

    // Guest's initial message (if provided)
    if (data.message?.trim()) {
      const guestMsg = this.msgRepo.create({
        conversationId: conv.id,
        message: data.message.trim(),
        type: MessageType.TEXT,
        // No senderCustomerId/senderUserId — it's a guest
      });
      await this.msgRepo.save(guestMsg);
      messages.push(guestMsg);
    }

    // Notify admin via socket
    try {
      const io = getIO();
      io.to('orders').emit('chat:new-conversation', {
        conversation: {
          id: conv.id,
          guestName: conv.guestName,
          guestPhone: conv.guestPhone,
          guestEmail: conv.guestEmail,
          lastMessage: data.message?.trim() || null,
          createdAt: conv.createdAt,
        },
      });
    } catch {}

    return { conversation: conv, messages };
  }

  /**
   * Get conversation with messages (for guest).
   */
  async getConversation(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundError('Cuộc hội thoại không tồn tại');

    const messages = await this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 100,
      relations: ['senderUser'],
    });

    return { conversation: conv, messages };
  }

  /**
   * Send a message as guest.
   */
  async sendGuestMessage(conversationId: string, messageText: string): Promise<Message> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundError('Cuộc hội thoại không tồn tại');
    if (conv.status === ConversationStatus.CLOSED) {
      throw new AppError('Cuộc hội thoại đã đóng', 400);
    }

    const msg = this.msgRepo.create({
      conversationId,
      message: messageText.trim(),
      type: MessageType.TEXT,
    });
    await this.msgRepo.save(msg);

    // Update lastMessageAt
    conv.lastMessageAt = new Date();
    await this.convRepo.save(conv);

    // Emit to conversation room (admin listening)
    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit('message:new', {
        ...msg,
        senderType: 'guest',
        senderName: conv.guestName,
      });
      // Also notify admin room
      io.to('orders').emit('chat:new-message', {
        conversationId,
        guestName: conv.guestName,
        message: messageText.trim(),
      });
    } catch {}

    // Schedule auto-reply if admin doesn't respond within 2 minutes
    this.scheduleAutoReply(conversationId);

    return msg;
  }

  /**
   * Schedule an auto-reply if no admin response within AUTO_REPLY_DELAY_MS.
   * Resets timer on each new guest message.
   */
  private scheduleAutoReply(conversationId: string) {
    // Clear existing timer for this conversation
    const existing = autoReplyTimers.get(conversationId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      autoReplyTimers.delete(conversationId);
      try {
        // Check if admin has replied since the timer was set
        const lastMsg = await this.msgRepo.findOne({
          where: { conversationId },
          order: { createdAt: 'DESC' },
        });

        // If last message is from admin (has senderUserId), don't auto-reply
        if (lastMsg?.senderUserId) return;

        // Check if we already sent an auto-reply recently (avoid spam)
        const recentAutoReply = await this.msgRepo.findOne({
          where: {
            conversationId,
            type: MessageType.SYSTEM,
            message: AUTO_REPLY_MESSAGE,
          },
          order: { createdAt: 'DESC' },
        });
        if (recentAutoReply) {
          const diff = Date.now() - new Date(recentAutoReply.createdAt).getTime();
          if (diff < 10 * 60 * 1000) return; // Don't repeat within 10 minutes
        }

        // Send auto-reply
        const autoMsg = this.msgRepo.create({
          conversationId,
          message: AUTO_REPLY_MESSAGE,
          type: MessageType.SYSTEM,
        });
        await this.msgRepo.save(autoMsg);

        // Emit to guest
        try {
          const io = getIO();
          io.to(`conversation:${conversationId}`).emit('message:new', {
            ...autoMsg,
            senderType: 'system',
          });
        } catch {}
      } catch {
        // Auto-reply failure is non-critical
      }
    }, AUTO_REPLY_DELAY_MS);

    autoReplyTimers.set(conversationId, timer);
  }
}
