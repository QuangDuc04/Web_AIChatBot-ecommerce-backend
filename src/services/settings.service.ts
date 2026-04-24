import { SettingsRepository } from '../repositories/settings.repository';
import { CacheUtil } from '../utils/cache.util';

export class SettingsService {
  private settingsRepo = new SettingsRepository();

  async getAllSettings(category?: string) {
    return this.settingsRepo.findAll(category);
  }

  async getSetting(key: string) {
    return this.settingsRepo.findByKeyOrFail(key);
  }

  async updateSetting(key: string, value: unknown, adminId: string, category?: string, description?: string) {
    const result = await this.settingsRepo.upsert(key, value, category, description, adminId);
    await CacheUtil.delPattern('settings:*');
    return result;
  }

  async bulkUpdateSettings(settings: Array<{ key: string; value: unknown; category?: string }>, adminId: string) {
    const results = [];
    for (const s of settings) {
      const result = await this.settingsRepo.upsert(s.key, s.value, s.category, undefined, adminId);
      results.push(result);
    }
    await CacheUtil.delPattern('settings:*');
    return results;
  }
}
