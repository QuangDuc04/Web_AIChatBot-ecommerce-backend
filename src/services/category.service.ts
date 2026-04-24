import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CloudinaryService } from './cloudinary.service';
import { AppError } from '../errors';
import { generateSlug } from '../utils/slug.util';

export class CategoryService {
  private categoryRepo = new CategoryRepository();

  async getAllCategories() {
    return this.categoryRepo.findAll();
  }

  async getCategoryTree() {
    return this.categoryRepo.buildCategoryTree();
  }

  async getCategory(id: string) {
    return this.categoryRepo.findByIdOrFail(id);
  }

  async getCategoryBySlug(slug: string) {
    const cat = await this.categoryRepo.findBySlug(slug);
    if (!cat) throw new AppError('Không tìm thấy danh mục', 404);
    return cat;
  }

  async createCategory(dto: CreateCategoryDto, files?: { icon?: Express.Multer.File; image?: Express.Multer.File }) {
    const slug = dto.slug || generateSlug(dto.name);

    // Check slug unique
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) throw new AppError('Slug danh mục đã tồn tại', 400);

    // Check parent exists
    // if (dto.parentId) {
    //   await this.categoryRepo.findByIdOrFail(dto.parentId);
    // }

    let icon: string | undefined;
    let image: string | undefined;
    if (files?.icon) {
      const result = await CloudinaryService.uploadImage(files.icon.buffer, 'categories/icons');
      icon = result.url;
    }
    if (files?.image) {
      const result = await CloudinaryService.uploadImage(files.image.buffer, 'categories/images');
      image = result.url;
    }

    return this.categoryRepo.create({ ...dto, slug, icon, image });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, files?: { icon?: Express.Multer.File; image?: Express.Multer.File }) {
    await this.categoryRepo.findByIdOrFail(id);

    if (dto.slug) {
      const existing = await this.categoryRepo.findBySlug(dto.slug);
      if (existing && existing.id !== id) throw new AppError('Slug danh mục đã tồn tại', 400);
    }

    if (dto.parentId) {
      if (dto.parentId === id) throw new AppError('Danh mục không thể là cha của chính nó', 400);
      await this.categoryRepo.findByIdOrFail(dto.parentId);
    }

    const updateData: any = { ...dto };
    if (files?.icon) {
      const result = await CloudinaryService.uploadImage(files.icon.buffer, 'categories/icons');
      updateData.icon = result.url;
    }
    if (files?.image) {
      const result = await CloudinaryService.uploadImage(files.image.buffer, 'categories/images');
      updateData.image = result.url;
    }

    return this.categoryRepo.update(id, updateData);
  }

  async deleteCategory(id: string) {
    await this.categoryRepo.findByIdOrFail(id);

    if (await this.categoryRepo.hasChildren(id)) {
      throw new AppError('Không thể xóa danh mục có danh mục con', 400);
    }
    if (await this.categoryRepo.hasProducts(id)) {
      throw new AppError('Không thể xóa danh mục đang có sản phẩm', 400);
    }

    await this.categoryRepo.delete(id);
  }
}
