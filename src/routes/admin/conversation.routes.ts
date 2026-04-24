import { Router } from 'express';
import { AdminConversationController } from '../../controllers/admin/conversation.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { AssignConversationDto } from '../../dtos/conversation.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminConversationController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.get('/:id/messages', ...staffAuth, ctrl.getMessages);
router.post('/:id/messages', ...staffAuth, ctrl.sendMessage);
router.post('/:id/assign', authenticate, authorize(UserRole.ADMIN), validateBody(AssignConversationDto), ctrl.assign);
router.put('/:id/close', ...staffAuth, ctrl.close);
router.put('/:id/reopen', ...staffAuth, ctrl.reopen);

export default router;
