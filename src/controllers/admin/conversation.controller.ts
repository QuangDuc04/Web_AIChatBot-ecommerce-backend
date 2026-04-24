import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../../services/conversation.service';
import { MessageRepository } from '../../repositories/message.repository';
import { ConversationParticipantRepository } from '../../repositories/conversationParticipant.repository';
import { ResponseUtil } from '../../utils/response.util';
import { MessageType, ParticipantRole } from '../../types/enums';
import { getIO } from '../../sockets';

const service = new ConversationService();
const messageRepo = new MessageRepository();
const participantRepo = new ConversationParticipantRepository();

export class AdminConversationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllConversations(req.query as any);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await service.getConversationForAdmin(req.params.id);
      ResponseUtil.success(res, conv);
    } catch (e) { next(e); }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const result = await messageRepo.findByConversationId(req.params.id, page, limit);
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const userId = req.user!.id;

      // Auto-join as participant if not already
      const existing = await participantRepo.findByUserAndConversation(userId, conversationId);
      if (!existing) {
        await participantRepo.create({
          conversationId,
          userId,
          role: ParticipantRole.STAFF,
        });
      }

      // Create message directly (bypass participant check since we just ensured it)
      const msg = await messageRepo.create({
        conversationId,
        senderUserId: userId,
        message: req.body.message,
        type: MessageType.TEXT,
      });

      // Emit to conversation room (guest listening)
      try {
        const io = getIO();
        const user = req.user!;
        io.to(`conversation:${conversationId}`).emit('message:new', {
          ...msg,
          senderType: 'admin',
          senderName: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Admin',
        });
      } catch {}

      ResponseUtil.created(res, msg, 'Gửi tin nhắn thành công');
    } catch (e) { next(e); }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await service.assignConversation(req.params.id, req.body.staffId);
      ResponseUtil.success(res, conv, 'Đã gán nhân viên');
    } catch (e) { next(e); }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await service.closeConversationByAdmin(req.params.id);
      ResponseUtil.success(res, conv, 'Đã đóng cuộc hội thoại');
    } catch (e) { next(e); }
  }

  async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await service.reopenConversation(req.params.id);
      ResponseUtil.success(res, conv, 'Đã mở lại cuộc hội thoại');
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getStats();
      ResponseUtil.success(res, stats);
    } catch (e) { next(e); }
  }
}
