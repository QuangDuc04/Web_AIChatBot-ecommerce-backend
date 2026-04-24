import { Router } from 'express';
import { AdminSettingsController } from '../../controllers/admin/settings.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminSettingsController();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', ctrl.getAll);
router.get('/:key', ctrl.getOne);
router.put('/:key', ctrl.update);
router.put('/', ctrl.bulkUpdate);

export default router;
