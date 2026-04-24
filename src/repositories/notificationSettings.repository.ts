import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { NotificationSettings } from '../entities/NotificationSettings';

export class NotificationSettingsRepository {
  private repo: Repository<NotificationSettings>;

  constructor() {
    this.repo = AppDataSource.getRepository(NotificationSettings);
  }

  async getOrCreate(customerId: string): Promise<NotificationSettings> {
    let settings = await this.repo.findOne({ where: { customerId } });
    if (!settings) {
      settings = this.repo.create({ customerId });
      settings = await this.repo.save(settings);
    }
    return settings;
  }

  async update(customerId: string, data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const settings = await this.getOrCreate(customerId);
    await this.repo.update(settings.id, data as any);
    return this.getOrCreate(customerId);
  }
}
