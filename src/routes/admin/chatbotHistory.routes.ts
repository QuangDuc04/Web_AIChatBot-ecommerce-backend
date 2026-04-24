import { Router } from 'express';
import { AdminChatbotHistoryController } from '../../controllers/admin/chatbotHistory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminChatbotHistoryController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/:id', ...staffAuth, ctrl.getOne);

export default router;
