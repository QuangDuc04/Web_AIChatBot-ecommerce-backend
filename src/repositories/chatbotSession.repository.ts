import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ChatbotSession } from '../entities/ChatbotSession';
import { ChatbotMessage, ChatbotMessageRole } from '../entities/ChatbotMessage';

export class ChatbotSessionRepository {
  private sessionRepo: Repository<ChatbotSession>;
  private messageRepo: Repository<ChatbotMessage>;

  constructor() {
    this.sessionRepo = AppDataSource.getRepository(ChatbotSession);
    this.messageRepo = AppDataSource.getRepository(ChatbotMessage);
  }

  /**
   * Find existing session by clientId or create a new one.
   */
  async findOrCreateSession(clientId: string): Promise<ChatbotSession> {
    const existing = await this.sessionRepo.findOne({ where: { clientId } });
    if (existing) return existing;

    const session = this.sessionRepo.create({ clientId });
    return this.sessionRepo.save(session);
  }

  /**
   * Save a user + assistant message pair and update session counters.
   */
  async saveMessages(
    sessionId: string,
    userMsg: string,
    assistantMsg: string,
    toolCalls?: Record<string, unknown>[],
  ): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const msgRepo = manager.getRepository(ChatbotMessage);
      const sessRepo = manager.getRepository(ChatbotSession);

      await msgRepo.save([
        msgRepo.create({
          sessionId,
          role: ChatbotMessageRole.USER,
          content: userMsg,
        }),
        msgRepo.create({
          sessionId,
          role: ChatbotMessageRole.ASSISTANT,
          content: assistantMsg,
          toolCalls: toolCalls?.length ? toolCalls : null,
        }),
      ]);

      await sessRepo
        .createQueryBuilder()
        .update(ChatbotSession)
        .set({
          messageCount: () => 'messageCount + 2',
          lastMessageAt: new Date(),
        })
        .where('id = :id', { id: sessionId })
        .execute();
    });
  }

  /**
   * Link a session to a Customer when phone/email is detected.
   */
  async linkCustomer(clientId: string, customerId: string): Promise<void> {
    await this.sessionRepo.update({ clientId }, { customerId });
  }

  /**
   * Get messages by clientId for history fallback (when Redis expired).
   */
  async getMessagesByClientId(
    clientId: string,
    limit = 50,
  ): Promise<ChatbotMessage[]> {
    const session = await this.sessionRepo.findOne({ where: { clientId } });
    if (!session) return [];

    return this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Paginated list of sessions for admin view.
   */
  async findAllSessions(opts: {
    page: number;
    limit: number;
    search?: string;
    customerId?: string;
  }): Promise<[ChatbotSession[], number]> {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.customer', 'c')
      .orderBy('s.lastMessageAt', 'DESC');

    if (opts.customerId) {
      qb.andWhere('s.customerId = :customerId', { customerId: opts.customerId });
    }

    if (opts.search) {
      qb.andWhere(
        '(s.clientId LIKE :search OR c.name LIKE :search OR c.phone LIKE :search)',
        { search: `%${opts.search}%` },
      );
    }

    qb.skip((opts.page - 1) * opts.limit).take(opts.limit);

    return qb.getManyAndCount();
  }

  /**
   * Get a single session with all messages for admin detail view.
   */
  async getSessionWithMessages(sessionId: string): Promise<ChatbotSession | null> {
    return this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['customer', 'messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }
}
