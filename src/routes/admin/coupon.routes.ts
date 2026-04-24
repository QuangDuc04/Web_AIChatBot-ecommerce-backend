import { Router } from 'express';
import { AdminCouponController } from '../../controllers/admin/coupon.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { CreateCouponDto, UpdateCouponDto } from '../../dtos/coupon.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminCouponController();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.get('/:id/usage', ctrl.getUsage);
router.post('/', validateBody(CreateCouponDto), ctrl.create);
router.put('/:id', validateBody(UpdateCouponDto), ctrl.update);
router.delete('/:id', ctrl.delete);

export default router;
