import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { MessageReadReceipt } from '../entities/MessageReadReceipt';

export class MessageReadReceiptRepository {
  private repo: Repository<MessageReadReceipt>;

  constructor() {
    this.repo = AppDataSource.getRepository(MessageReadReceipt);
  }

  async findByMessageId(messageId: string): Promise<MessageReadReceipt[]> {
    return this.repo.find({ where: { messageId }, relations: ['user', 'customer'] });
  }

  async markAsRead(userId: string, messageId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, messageId } });
    if (!existing) {
      await this.repo.save(this.repo.create({ userId, messageId }));
    }
  }

  async markAsReadByCustomer(customerId: string, messageId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { customerId, messageId } });
    if (!existing) {
      await this.repo.save(this.repo.create({ customerId, messageId }));
    }
  }
}
