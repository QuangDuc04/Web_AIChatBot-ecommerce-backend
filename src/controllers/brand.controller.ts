import { Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brand.service';
import { ResponseUtil } from '../utils/response.util';

const service = new BrandService();

export class BrandController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, isActive, page, limit } = req.query;
      const result = await service.getAllBrands({
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await service.getBrand(req.params.id);
      ResponseUtil.success(res, brand);
    } catch (e) { next(e); }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await service.getBrandBySlug(req.params.slug);
      ResponseUtil.success(res, brand);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await service.createBrand(req.body, req.file);
      ResponseUtil.created(res, brand, 'Tạo thương hiệu thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await service.updateBrand(req.params.id, req.body, req.file);
      ResponseUtil.success(res, brand, 'Cập nhật thương hiệu thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteBrand(req.params.id);
      ResponseUtil.success(res, null, 'Xóa thương hiệu thành công');
    } catch (e) { next(e); }
  }
}
