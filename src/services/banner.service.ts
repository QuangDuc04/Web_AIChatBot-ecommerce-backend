import { BannerRepository } from '../repositories/banner.repository';
import { CloudinaryService } from './cloudinary.service';
import { CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dto';
import { CacheUtil } from '../utils/cache.util';
import { BannerPlacement } from '../types/enums';

const CACHE_KEY = 'banners:active';

export class BannerService {
  private bannerRepo = new BannerRepository();

  async getActiveBanners(placement?: BannerPlacement) {
    const cacheKey = placement ? `${CACHE_KEY}:${placement}` : CACHE_KEY;
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const banners = await this.bannerRepo.findActive(placement);
    await CacheUtil.set(cacheKey, banners, 900);
    return banners;
  }

  async getAllBanners(filters?: { placement?: BannerPlacement; isActive?: boolean; page?: number; limit?: number }) {
    return this.bannerRepo.findAll(filters);
  }

  async createBanner(dto: CreateBannerDto, imageFile?: Express.Multer.File) {
    let image = '';
    if (imageFile) {
      const result = await CloudinaryService.uploadImage(imageFile.buffer, 'banners');
      image = result.url;
    }

    const { status: _s, linkUrl: _lu, sortOrder: _so, subtitle: _sub, ...rest } = dto as any;
    const createData: any = {
      ...rest,
      image,
      ...(dto.linkUrl && !dto.link && { link: dto.linkUrl }),
      ...(dto.sortOrder !== undefined && dto.displayOrder === undefined && { displayOrder: dto.sortOrder }),
      ...(dto.status !== undefined && { isActive: dto.status === 'active' }),
    };
    if (dto.startDate) createData.startDate = new Date(dto.startDate);
    if (dto.endDate) createData.endDate = new Date(dto.endDate);

    const banner = await this.bannerRepo.create(createData);
    await CacheUtil.delPattern('banners:*');
    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto, imageFile?: Express.Multer.File) {
    await this.bannerRepo.findByIdOrFail(id);
    const { status: _s, linkUrl: _lu, sortOrder: _so, subtitle: _sub, ...rest } = dto as any;
    const data: any = { ...rest };
    if (dto.linkUrl && !dto.link) data.link = dto.linkUrl;
    if (dto.sortOrder !== undefined && dto.displayOrder === undefined) data.displayOrder = dto.sortOrder;
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (imageFile) {
      const result = await CloudinaryService.uploadImage(imageFile.buffer, 'banners');
      data.image = result.url;
    }
    const banner = await this.bannerRepo.update(id, data);
    await CacheUtil.delPattern('banners:*');
    return banner;
  }

  async deleteBanner(id: string) {
    await this.bannerRepo.findByIdOrFail(id);
    await this.bannerRepo.delete(id);
    await CacheUtil.delPattern('banners:*');
  }
}
