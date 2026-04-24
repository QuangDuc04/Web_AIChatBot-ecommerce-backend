import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Conversation } from '../entities/Conversation';
import { NotFoundError } from '../errors';
import { ConversationFilterDto } from '../dtos/conversation.dto';
import { ConversationStatus } from '../types/enums';
import { deepSanitizeUsers } from '../utils/sanitize.util';

export class ConversationRepository {
  private repo: Repository<Conversation>;

  constructor() {
    this.repo = AppDataSource.getRepository(Conversation);
  }

  async findAll(filters: ConversationFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.customer', 'customer');

    if (filters.status) qb.andWhere('c.status = :status', { status: filters.status });
    if (filters.type) qb.andWhere('c.type = :type', { type: filters.type });
    qb.orderBy('c.lastMessageAt', 'DESC');

    const total = await qb.getCount();
    const conversations = await qb.skip((page - 1) * limit).take(limit).getMany();
    deepSanitizeUsers(conversations);
    return { items: conversations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Conversation | null> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['participants', 'participants.user', 'participants.customer', 'order'],
    });
    deepSanitizeUsers(c);
    return c;
  }

  async findByIdOrFail(id: string): Promise<Conversation> {
    const c = await this.findById(id);
    if (!c) throw new NotFoundError('Không tìm thấy cuộc hội thoại');
    return c;
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const c = this.repo.create(data);
    return this.repo.save(c);
  }

  async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async updateLastMessageAt(id: string): Promise<void> {
    await this.repo.update(id, { lastMessageAt: new Date() });
  }

  async countOpen(): Promise<number> {
    return this.repo.count({ where: { status: ConversationStatus.OPEN } });
  }
}
