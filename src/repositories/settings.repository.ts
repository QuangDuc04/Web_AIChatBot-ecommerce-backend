import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Setting } from '../entities/Setting';
import { NotFoundError } from '../errors';

export class SettingsRepository {
  private repo: Repository<Setting>;

  constructor() {
    this.repo = AppDataSource.getRepository(Setting);
  }

  async findAll(category?: string): Promise<Setting[]> {
    const where: any = {};
    if (category) where.category = category;
    return this.repo.find({ where, order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<Setting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async findByKeyOrFail(key: string): Promise<Setting> {
    const s = await this.findByKey(key);
    if (!s) throw new NotFoundError('Không tìm thấy cài đặt');
    return s;
  }

  async upsert(key: string, value: unknown, category?: string, description?: string, updatedBy?: string): Promise<Setting> {
    let setting = await this.findByKey(key);
    if (setting) {
      await this.repo.update(setting.id, { value, category, description, updatedBy } as any);
      return this.findByKeyOrFail(key);
    }
    return this.repo.save(this.repo.create({ key, value, category, description, updatedBy }));
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete({ key });
  }
}
