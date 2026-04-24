import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Message } from '../entities/Message';
import { NotFoundError } from '../errors';
import { deepSanitizeUsers } from '../utils/sanitize.util';

export class MessageRepository {
  private repo: Repository<Message>;

  constructor() {
    this.repo = AppDataSource.getRepository(Message);
  }

  async findByConversationId(conversationId: string, page = 1, limit = 50) {
    const [messages, total] = await this.repo.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['senderCustomer', 'senderUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    deepSanitizeUsers(messages);
    return { items: messages.reverse(), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Message | null> {
    const m = await this.repo.findOne({ where: { id }, relations: ['senderCustomer', 'senderUser'] });
    deepSanitizeUsers(m);
    return m;
  }

  async findByIdOrFail(id: string): Promise<Message> {
    const m = await this.findById(id);
    if (!m) throw new NotFoundError('Không tìm thấy tin nhắn');
    return m;
  }

  async create(data: Partial<Message>): Promise<Message> {
    const m = this.repo.create(data);
    const saved = await this.repo.save(m);
    return this.findByIdOrFail(saved.id);
  }

  async update(id: string, data: Partial<Message>): Promise<Message> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.update(id, { isDeleted: true });
  }

  async getLastMessage(conversationId: string): Promise<Message | null> {
    return this.repo.findOne({
      where: { conversationId, isDeleted: false },
      order: { createdAt: 'DESC' },
      relations: ['senderCustomer', 'senderUser'],
    });
  }
}
