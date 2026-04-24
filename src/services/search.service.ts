import { SearchLogRepository } from '../repositories/searchLog.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CacheUtil } from '../utils/cache.util';
import { SearchProductsDto } from '../dtos/search.dto';
import { ProductSortEnum } from '../dtos/product.dto';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';

export class SearchService {
  private searchLogRepo = new SearchLogRepository();
  private productRepo = new ProductRepository();

  async searchProducts(dto: SearchProductsDto, customerId?: string, sessionId?: string) {
    const sortMap: Record<string, ProductSortEnum> = {
      relevance: ProductSortEnum.NEWEST,
      price_asc: ProductSortEnum.PRICE_ASC,
      price_desc: ProductSortEnum.PRICE_DESC,
      newest: ProductSortEnum.NEWEST,
    };

    const result = await this.productRepo.findAll({
      search: dto.query,
      page: dto.page,
      limit: dto.limit,
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      sort: sortMap[dto.sort || 'relevance'],
    });

    // Log search
    this.searchLogRepo.create({
      query: dto.query,
      customerId,
      sessionId,
      resultsCount: result.total,
    }).catch(() => {});

    return result;
  }

  async getSearchSuggestions(query: string, limit = 5) {
    const cacheKey = `search:suggest:${query.toLowerCase()}`;
    const cached = await CacheUtil.get<string[]>(cacheKey);
    if (cached) return cached;

    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.createQueryBuilder('p')
      .select('p.name', 'name')
      .where('p.name LIKE :q', { q: `%${query}%` })
      .andWhere('p.isActive = true')
      .limit(limit)
      .getRawMany();

    const suggestions = products.map((p: any) => p.name);
    await CacheUtil.set(cacheKey, suggestions, 3600);
    return suggestions;
  }

  async getRecentSearches(customerId: string) {
    const logs = await this.searchLogRepo.findByCustomerId(customerId, 10);
    const seen = new Set<string>();
    return logs.filter(l => { if (seen.has(l.query)) return false; seen.add(l.query); return true; })
      .map(l => l.query);
  }

  async deleteSearchHistory(customerId: string) {
    await this.searchLogRepo.deleteCustomerHistory(customerId);
  }

  async getPopularSearches(limit = 10) {
    const cached = await CacheUtil.get('search:popular');
    if (cached) return cached;
    const popular = await this.searchLogRepo.findPopularSearches(limit);
    await CacheUtil.set('search:popular', popular, 3600);
    return popular;
  }

  async getTrendingSearches(limit = 10) {
    return this.searchLogRepo.getTrendingSearches(7, limit);
  }
}
