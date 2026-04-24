import { Request, Response, NextFunction } from 'express';
import { ChatbotSessionRepository } from '../../repositories/chatbotSession.repository';
import { ResponseUtil } from '../../utils/response.util';

const repo = new ChatbotSessionRepository();

export class AdminChatbotHistoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const search = req.query.search as string | undefined;
      const customerId = req.query.customerId as string | undefined;

      const [sessions, total] = await repo.findAllSessions({ page, limit, search, customerId });

      ResponseUtil.success(res, {
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await repo.getSessionWithMessages(req.params.id);
      if (!session) {
        return ResponseUtil.error(res, 'Session not found', 404);
      }
      ResponseUtil.success(res, session);
    } catch (e) { next(e); }
  }
}
