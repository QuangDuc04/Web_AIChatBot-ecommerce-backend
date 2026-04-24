import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { optionalCustomerAuth } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { ValidateCouponDto } from '../dtos/coupon.dto';

const router = Router();
const ctrl = new CouponController();

router.get('/active', ctrl.getActiveCoupons);
router.post('/validate', optionalCustomerAuth, validateBody(ValidateCouponDto), ctrl.validateCoupon);

export default router;
