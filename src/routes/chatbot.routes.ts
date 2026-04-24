import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { chatbotBurstLimiter, chatbotDailyLimiter } from '../middlewares/rateLimiter.middleware';
import { ChatbotMessageDto } from '../dtos/chatbot.dto';
import { UserRole } from '../types/enums';

const router = Router();
const ctrl = new ChatbotController();

router.post(
  '/message',
  chatbotBurstLimiter,
  chatbotDailyLimiter,
  validateBody(ChatbotMessageDto),
  ctrl.sendMessage,
);
router.get('/history', ctrl.getHistory);
router.delete('/history', ctrl.clearHistory);
router.delete('/knowledge', authenticate, authorize(UserRole.ADMIN), ctrl.clearKnowledge);

export default router;
