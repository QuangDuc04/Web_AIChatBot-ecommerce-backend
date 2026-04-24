import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/cloudinary.service';
import { ResponseUtil } from '../utils/response.util';

export class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) return ResponseUtil.error(res, 'Vui lòng chọn ảnh', 400);
      const folder = (req.query.folder as string) || 'general';
      const result = await CloudinaryService.uploadImage(req.file.buffer, folder);
      ResponseUtil.created(res, result, 'Upload ảnh thành công');
    } catch (e) { next(e); }
  }

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) return ResponseUtil.error(res, 'Vui lòng chọn ảnh', 400);
      const folder = (req.query.folder as string) || 'general';
      const results = await CloudinaryService.uploadMultipleImages(files, folder);
      ResponseUtil.created(res, results, 'Upload ảnh thành công');
    } catch (e) { next(e); }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicId } = req.body;
      if (!publicId) return ResponseUtil.error(res, 'publicId không được để trống', 400);
      await CloudinaryService.deleteImage(publicId);
      ResponseUtil.success(res, null, 'Xóa ảnh thành công');
    } catch (e) { next(e); }
  }
}
