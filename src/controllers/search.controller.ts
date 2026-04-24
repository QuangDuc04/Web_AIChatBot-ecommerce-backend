import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { ResponseUtil } from '../utils/response.util';

const service = new SearchService();

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.searchProducts(req.query as any, req.customer?.id)); } catch (e) { next(e); }
  }
  async suggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q || req.query.query) as string | undefined;
      if (!query || !query.trim()) {
        return ResponseUtil.success(res, []);
      }
      ResponseUtil.success(res, await service.getSearchSuggestions(query.trim(), Number(req.query.limit) || 5));
    } catch (e) { next(e); }
  }
  async recent(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getRecentSearches(req.customer!.id)); } catch (e) { next(e); }
  }
  async deleteHistory(req: Request, res: Response, next: NextFunction) {
    try { await service.deleteSearchHistory(req.customer!.id); ResponseUtil.success(res, null, 'Đã xóa lịch sử tìm kiếm'); } catch (e) { next(e); }
  }
  async popular(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getPopularSearches()); } catch (e) { next(e); }
  }
  async trending(req: Request, res: Response, next: NextFunction) {
    try { ResponseUtil.success(res, await service.getTrendingSearches()); } catch (e) { next(e); }
  }
}
