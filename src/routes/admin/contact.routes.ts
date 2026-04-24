import { Router } from 'express';
import { AdminContactController } from '../../controllers/contact.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { UpdateContactStatusDto } from '../../dtos/contact.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminContactController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.put('/:id/status', ...staffAuth, validateBody(UpdateContactStatusDto), ctrl.updateStatus);
router.delete('/:id', ...staffAuth, ctrl.delete);

export default router;
