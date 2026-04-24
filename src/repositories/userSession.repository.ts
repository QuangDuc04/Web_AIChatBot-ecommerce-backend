import { LessThan, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { UserSession } from '../entities/UserSession';

export class UserSessionRepository {
  private repo: Repository<UserSession>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserSession);
  }

  async create(sessionData: Partial<UserSession>): Promise<UserSession> {
    const session = this.repo.create(sessionData);
    return this.repo.save(session);
  }

  async findByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    return this.repo.findOne({
      where: { refreshToken },
      relations: ['user'],
    });
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await this.repo.delete({ refreshToken });
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
