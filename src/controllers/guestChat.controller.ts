import { Request, Response, NextFunction } from 'express';
import { GuestChatService } from '../services/guestChat.service';
import { ResponseUtil } from '../utils/response.util';

const service = new GuestChatService();

export class GuestChatController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, message } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const device = req.headers['user-agent'];

      const result = await service.startConversation({
        name, phone, email, message,
        ipAddress, device,
      });

      ResponseUtil.created(res, result, 'Bắt đầu cuộc hội thoại thành công');
    } catch (e) { next(e); }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getConversation(req.params.id);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await service.sendGuestMessage(req.params.id, req.body.message);
      ResponseUtil.created(res, msg, 'Gửi tin nhắn thành công');
    } catch (e) { next(e); }
  }
}
