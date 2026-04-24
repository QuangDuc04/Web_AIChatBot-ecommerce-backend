import { Router } from 'express';
import { AdminOrderController } from '../../controllers/admin/order.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { UpdateOrderStatusDto, CancelOrderDto } from '../../dtos/order.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminOrderController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/revenue', ...staffAuth, ctrl.getRevenue);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.put('/:id/status', ...staffAuth, validateBody(UpdateOrderStatusDto), ctrl.updateStatus);
router.put('/bulk-update-status', ...staffAuth, ctrl.bulkUpdateStatus);

export default router;
