import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ResponseUtil } from '../utils/response.util';

const service = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await service.getAllCategories();
      ResponseUtil.success(res, categories);
    } catch (e) { next(e); }
  }

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await service.getCategoryTree();
      ResponseUtil.success(res, tree);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await service.getCategory(req.params.id);
      ResponseUtil.success(res, category);
    } catch (e) { next(e); }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await service.getCategoryBySlug(req.params.slug);
      ResponseUtil.success(res, category);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedFiles = {
        icon: files?.['icon']?.[0],
        image: files?.['image']?.[0],
      };
      const category = await service.createCategory(req.body, uploadedFiles);
      ResponseUtil.created(res, category, 'Tạo danh mục thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedFiles = {
        icon: files?.['icon']?.[0],
        image: files?.['image']?.[0],
      };
      const category = await service.updateCategory(req.params.id, req.body, uploadedFiles);
      ResponseUtil.success(res, category, 'Cập nhật danh mục thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteCategory(req.params.id);
      ResponseUtil.success(res, null, 'Xóa danh mục thành công');
    } catch (e) { next(e); }
  }
}
