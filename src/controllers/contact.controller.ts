import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { ResponseUtil } from '../utils/response.util';

const service = new ContactService();

export class ContactController {
  /** Public: submit contact/quote form */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await service.create(req.body, ipAddress);
      ResponseUtil.created(res, result, 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất!');
    } catch (e) { next(e); }
  }
}

export class AdminContactController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status } = req.query as any;
      const result = await service.findAll(Number(page), Number(limit), status);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findById(req.params.id);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updateStatus(req.params.id, req.body);
      ResponseUtil.success(res, result, 'Cập nhật trạng thái thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      ResponseUtil.success(res, null, 'Đã xóa liên hệ');
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.countByStatus();
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }
}
