import { BrandRepository } from '../repositories/brand.repository';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dto';
import { CloudinaryService } from './cloudinary.service';
import { AppError } from '../errors';
import { generateSlug } from '../utils/slug.util';

export class BrandService {
  private brandRepo = new BrandRepository();

  async getAllBrands(filters?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    return this.brandRepo.findAll(filters);
  }

  async getBrand(id: string) {
    return this.brandRepo.findByIdOrFail(id);
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.brandRepo.findBySlug(slug);
    if (!brand) throw new AppError('Không tìm thấy thương hiệu', 404);
    return brand;
  }

  async createBrand(dto: CreateBrandDto, logoFile?: Express.Multer.File) {
    const slug = dto.slug || generateSlug(dto.name);

    const existing = await this.brandRepo.findBySlug(slug);
    if (existing) throw new AppError('Slug thương hiệu đã tồn tại', 400);

    let logo: string | undefined;
    if (logoFile) {
      const result = await CloudinaryService.uploadImage(logoFile.buffer, 'brands');
      logo = result.url;
    }

    const isActive = dto.status !== undefined ? dto.status === 'active' : true;
    const { status: _s, ...rest } = dto;
    return this.brandRepo.create({ ...rest, slug, logo, isActive });
  }

  async updateBrand(id: string, dto: UpdateBrandDto, logoFile?: Express.Multer.File) {
    const brand = await this.brandRepo.findByIdOrFail(id);

    if (dto.slug) {
      const existing = await this.brandRepo.findBySlug(dto.slug);
      if (existing && existing.id !== id) throw new AppError('Slug thương hiệu đã tồn tại', 400);
    }

    const updateData: any = { ...dto };
    if (dto.status !== undefined) updateData.isActive = dto.status === 'active';
    delete updateData.status;
    if (logoFile) {
      const result = await CloudinaryService.uploadImage(logoFile.buffer, 'brands');
      updateData.logo = result.url;
      // Note: Old logo not tracked by publicId in brand entity; would need schema change to fully support deletion
    }

    return this.brandRepo.update(id, updateData);
  }

  async deleteBrand(id: string) {
    await this.brandRepo.findByIdOrFail(id);

    if (await this.brandRepo.hasProducts(id)) {
      throw new AppError('Không thể xóa thương hiệu đang có sản phẩm', 400);
    }

    await this.brandRepo.delete(id);
  }
}
