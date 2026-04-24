import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ConversationParticipant } from '../entities/ConversationParticipant';

export class ConversationParticipantRepository {
  private repo: Repository<ConversationParticipant>;

  constructor() {
    this.repo = AppDataSource.getRepository(ConversationParticipant);
  }

  async findByConversationId(conversationId: string): Promise<ConversationParticipant[]> {
    return this.repo.find({ where: { conversationId }, relations: ['user', 'customer'] });
  }

  async findByUserAndConversation(userId: string, conversationId: string): Promise<ConversationParticipant | null> {
    return this.repo.findOne({ where: { userId, conversationId } });
  }

  async findByCustomerAndConversation(customerId: string, conversationId: string): Promise<ConversationParticipant | null> {
    return this.repo.findOne({ where: { customerId, conversationId } });
  }

  async create(data: Partial<ConversationParticipant>): Promise<ConversationParticipant> {
    const p = this.repo.create(data);
    return this.repo.save(p);
  }

  async updateLastReadAt(userId: string, conversationId: string): Promise<void> {
    await this.repo.update({ userId, conversationId }, { lastReadAt: new Date() });
  }

  async updateLastReadAtByCustomer(customerId: string, conversationId: string): Promise<void> {
    await this.repo.update({ customerId, conversationId }, { lastReadAt: new Date() });
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.repo.find({ where: { userId }, select: ['conversationId'] });
    return participants.map(p => p.conversationId);
  }

  async getCustomerConversationIds(customerId: string): Promise<string[]> {
    const participants = await this.repo.find({ where: { customerId }, select: ['conversationId'] });
    return participants.map(p => p.conversationId);
  }
}
