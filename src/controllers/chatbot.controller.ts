import { Request, Response, NextFunction } from 'express';
import { AIChatbotService } from '../services/ai/ai-chatbot.service';
import { ResponseUtil } from '../utils/response.util';
import crypto from 'crypto';

const service = new AIChatbotService();

export class ChatbotController {
  /** POST /api/chatbot/message — Send message, get AI response */
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message?.trim()) {
        return ResponseUtil.error(res, 'Tin nhắn không được để trống', 400);
      }

      // Use session ID from header or generate one
      const sessionId =
        (req.headers['x-session-id'] as string) ||
        (req.headers['x-chatbot-session'] as string) ||
        crypto.randomUUID();

      const clientOrigin = req.headers.origin as string | undefined;
      const result = await service.processMessage(sessionId, message.trim(), clientOrigin);

      ResponseUtil.success(res, {
        reply: result.reply,
        sessionId,
        escalated: result.escalated || false,
      });
    } catch (e) {
      next(e);
    }
  }

  /** GET /api/chatbot/history — Get conversation history */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId =
        (req.headers['x-session-id'] as string) ||
        (req.query.sessionId as string);

      if (!sessionId) {
        return ResponseUtil.error(res, 'Session ID required', 400);
      }

      const history = await service.getHistory(sessionId);
      ResponseUtil.success(res, { messages: history });
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /api/chatbot/history — Clear conversation */
  async clearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId =
        (req.headers['x-session-id'] as string) ||
        (req.query.sessionId as string);

      if (!sessionId) {
        return ResponseUtil.error(res, 'Session ID required', 400);
      }

      await service.clearHistory(sessionId);
      ResponseUtil.success(res, null, 'Đã xóa lịch sử chat');
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /api/chatbot/knowledge — Clear cached Q&A knowledge (admin) */
  async clearKnowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.clearKnowledge();
      ResponseUtil.success(res, result, 'Đã xóa cache knowledge');
    } catch (e) {
      next(e);
    }
  }
}
