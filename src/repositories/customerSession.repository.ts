// @ts-nocheck — Dead file: customer sessions removed (guest-only checkout)
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CustomerSession } from '../entities/CustomerSession';

export class CustomerSessionRepository {
  private repo: Repository<CustomerSession>;

  constructor() {
    this.repo = AppDataSource.getRepository(CustomerSession);
  }

  async create(data: Partial<CustomerSession>): Promise<CustomerSession> {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }

  async findByRefreshToken(refreshToken: string): Promise<CustomerSession | null> {
    return this.repo.findOne({ where: { refreshToken } });
  }

  async findByCustomerId(customerId: string): Promise<CustomerSession[]> {
    return this.repo.find({ where: { customerId }, relations: ['customer'] });
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await this.repo.delete({ refreshToken });
  }

  async deleteCustomerSessions(customerId: string): Promise<void> {
    await this.repo.delete({ customerId });
  }

  async deleteExpired(): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
