import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ResponseUtil } from '../utils/response.util';

const service = new ProductService();

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllProducts(req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.getProduct(req.params.id, req.customer?.id, req.ip);
      ResponseUtil.success(res, product);
    } catch (e) { next(e); }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.getProductBySlug(req.params.slug, req.customer?.id, req.ip);
      ResponseUtil.success(res, product);
    } catch (e) { next(e); }
  }

  async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const products = await service.getFeaturedProducts(limit);
      ResponseUtil.success(res, products);
    } catch (e) { next(e); }
  }

  async getBestSellers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const products = await service.getBestSellers(limit);
      ResponseUtil.success(res, products);
    } catch (e) { next(e); }
  }

  async getRelated(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const products = await service.getRelatedProducts(req.params.id, limit);
      ResponseUtil.success(res, products);
    } catch (e) { next(e); }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const result = await service.searchProducts(q, req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const product = await service.createProduct(req.body, files);
      ResponseUtil.created(res, product, 'Tạo sản phẩm thành công');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await service.updateProduct(req.params.id, req.body);
      ResponseUtil.success(res, product, 'Cập nhật sản phẩm thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteProduct(req.params.id);
      ResponseUtil.success(res, null, 'Xóa sản phẩm thành công');
    } catch (e) { next(e); }
  }

  // Images
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) return ResponseUtil.error(res, 'Vui lòng chọn ảnh', 400);
      const images = await service.uploadProductImages(req.params.id, files);
      ResponseUtil.created(res, images, 'Upload ảnh thành công');
    } catch (e) { next(e); }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteProductImage(req.params.id, req.params.imageId);
      ResponseUtil.success(res, null, 'Xóa ảnh thành công');
    } catch (e) { next(e); }
  }

  async setPrimaryImage(req: Request, res: Response, next: NextFunction) {
    try {
      await service.setPrimaryImage(req.params.id, req.params.imageId);
      ResponseUtil.success(res, null, 'Đặt ảnh chính thành công');
    } catch (e) { next(e); }
  }

  async reorderImages(req: Request, res: Response, next: NextFunction) {
    try {
      const images = await service.reorderImages(req.params.id, req.body.images);
      ResponseUtil.success(res, images, 'Sắp xếp ảnh thành công');
    } catch (e) { next(e); }
  }

  // Variants
  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.createVariant(req.params.id, req.body);
      ResponseUtil.created(res, variant, 'Tạo biến thể thành công');
    } catch (e) { next(e); }
  }

  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.updateVariant(req.params.variantId, req.body);
      ResponseUtil.success(res, variant, 'Cập nhật biến thể thành công');
    } catch (e) { next(e); }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteVariant(req.params.variantId);
      ResponseUtil.success(res, null, 'Xóa biến thể thành công');
    } catch (e) { next(e); }
  }
}
