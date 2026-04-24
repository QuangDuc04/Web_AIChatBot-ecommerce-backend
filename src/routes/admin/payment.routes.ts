import { Router } from 'express';
import { AdminPaymentController } from '../../controllers/admin/payment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { RefundPaymentDto } from '../../dtos/payment.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminPaymentController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.post('/:orderId/confirm-cod', ...staffAuth, ctrl.confirmCOD);
router.post('/:id/refund', authenticate, authorize(UserRole.ADMIN), validateBody(RefundPaymentDto), ctrl.refund);

export default router;
