import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SearchLog } from '../entities/SearchLog';

export class SearchLogRepository {
  private repo: Repository<SearchLog>;

  constructor() {
    this.repo = AppDataSource.getRepository(SearchLog);
  }

  async create(data: Partial<SearchLog>): Promise<SearchLog> {
    const l = this.repo.create(data);
    return this.repo.save(l);
  }

  async findByCustomerId(customerId: string, limit = 10): Promise<SearchLog[]> {
    return this.repo.find({ where: { customerId }, order: { searchedAt: 'DESC' }, take: limit });
  }

  async findPopularSearches(limit = 10) {
    return this.repo.createQueryBuilder('s')
      .select('s.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTrendingSearches(days = 7, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.repo.createQueryBuilder('s')
      .select('s.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('s.searchedAt >= :since', { since })
      .groupBy('s.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async deleteCustomerHistory(customerId: string): Promise<void> {
    await this.repo.delete({ customerId });
  }
}
