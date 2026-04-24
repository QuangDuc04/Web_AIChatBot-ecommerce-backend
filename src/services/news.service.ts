import { NewsRepository } from '../repositories/news.repository';
import { CloudinaryService } from './cloudinary.service';
import { CreateNewsDto, UpdateNewsDto } from '../dtos/news.dto';
import { CacheUtil } from '../utils/cache.util';
import { generateSlug } from '../utils/slug.util';
import { AppError } from '../errors';

const CACHE_KEY = 'news:active';

export class NewsService {
  private newsRepo = new NewsRepository();

  async getActiveNews() {
    const cached = await CacheUtil.get(CACHE_KEY);
    if (cached) return cached;

    const news = await this.newsRepo.findActive();
    await CacheUtil.set(CACHE_KEY, news, 900);
    return news;
  }

  async getAllNews(filters?: { isActive?: boolean; search?: string; page?: number; limit?: number }) {
    return this.newsRepo.findAll(filters);
  }

  async getNewsById(id: string) {
    return this.newsRepo.findByIdOrFail(id);
  }

  async getNewsBySlug(slug: string) {
    const news = await this.newsRepo.findBySlug(slug);
    if (!news) throw new AppError('Không tìm thấy bài viết', 404);
    return news;
  }

  async createNews(dto: CreateNewsDto, imageFile?: Express.Multer.File) {
    let thumbnail = '';
    if (imageFile) {
      const result = await CloudinaryService.uploadImage(imageFile.buffer, 'news');
      thumbnail = result.url;
    }

    const slug = dto.slug || generateSlug(dto.title);
    const existing = await this.newsRepo.findBySlug(slug);
    if (existing) throw new AppError('Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);

    const createData: any = {
      ...dto,
      slug,
      thumbnail,
    };
    if (dto.publishedAt) createData.publishedAt = new Date(dto.publishedAt);
    if (dto.tags) createData.tags = dto.tags.split(',').map((t: string) => t.trim()).filter(Boolean);

    const news = await this.newsRepo.create(createData);
    await CacheUtil.delPattern('news:*');
    return news;
  }

  async updateNews(id: string, dto: UpdateNewsDto, imageFile?: Express.Multer.File) {
    await this.newsRepo.findByIdOrFail(id);

    const data: any = { ...dto };
    if (imageFile) {
      const result = await CloudinaryService.uploadImage(imageFile.buffer, 'news');
      data.thumbnail = result.url;
    }
    if (dto.title && !dto.slug) data.slug = generateSlug(dto.title);
    if (dto.publishedAt) data.publishedAt = new Date(dto.publishedAt);
    if (dto.tags) data.tags = dto.tags.split(',').map((t: string) => t.trim()).filter(Boolean);

    const news = await this.newsRepo.update(id, data);
    await CacheUtil.delPattern('news:*');
    return news;
  }

  async deleteNews(id: string) {
    await this.newsRepo.findByIdOrFail(id);
    await this.newsRepo.delete(id);
    await CacheUtil.delPattern('news:*');
  }
}
