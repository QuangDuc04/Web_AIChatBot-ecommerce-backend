import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { NotFoundError } from '../errors';

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { googleId } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repo.create(userData);
    return this.repo.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.repo.update(id, userData as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.repo.update(id, {
      lastSeenAt: new Date(),
      isOnline: true,
    });
  }

  async setOffline(id: string): Promise<void> {
    await this.repo.update(id, { isOnline: false });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { emailVerificationToken: token } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { passwordResetToken: token } });
  }

  async findIdsByRole(role: string): Promise<string[]> {
    const users = await this.repo.find({ where: { role: role as any }, select: ['id'] });
    return users.map((u) => u.id);
  }

  async findAllIds(): Promise<string[]> {
    const users = await this.repo.find({ select: ['id'] });
    return users.map((u) => u.id);
  }
}
