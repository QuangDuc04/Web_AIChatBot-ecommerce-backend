import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { ResponseUtil } from '../utils/response.util';

const convService = new ConversationService();
const msgService = new MessageService();

export class ConversationController {
  async getMyConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await convService.getMyConversations(req.customer!.id, req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await convService.getConversation(req.params.id, req.customer!.id);
      ResponseUtil.success(res, conv);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await convService.createConversation(req.customer!.id, req.body);
      ResponseUtil.created(res, conv, 'Tạo cuộc hội thoại thành công');
    } catch (e) { next(e); }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await convService.closeConversation(req.params.id, req.customer!.id);
      ResponseUtil.success(res, conv, 'Đã đóng cuộc hội thoại');
    } catch (e) { next(e); }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const result = await msgService.getMessages(req.params.id, req.customer!.id, 'customer', page, limit);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const msg = await msgService.sendMessage(req.customer!.id, 'customer', {
        conversationId: req.params.id,
        message: req.body.message,
        type: req.body.type,
      }, files);
      ResponseUtil.created(res, msg, 'Gửi tin nhắn thành công');
    } catch (e) { next(e); }
  }

  async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await msgService.editMessage(req.params.messageId, req.customer!.id, 'customer', req.body);
      ResponseUtil.success(res, msg, 'Cập nhật tin nhắn thành công');
    } catch (e) { next(e); }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      await msgService.deleteMessage(req.params.messageId, req.customer!.id, 'customer');
      ResponseUtil.success(res, null, 'Đã xóa tin nhắn');
    } catch (e) { next(e); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await msgService.markAsRead(req.customer!.id, 'customer', req.params.id);
      ResponseUtil.success(res, null, 'Đã đánh dấu đã đọc');
    } catch (e) { next(e); }
  }
}
