import { Router } from 'express';
import { AdminAnalyticsController } from '../../controllers/admin/analytics.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminAnalyticsController();
const auth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/dashboard', ...auth, ctrl.dashboard);
router.get('/revenue', ...auth, ctrl.revenue);
router.get('/products', ...auth, ctrl.products);
router.get('/customers', ...auth, ctrl.customers);
router.get('/orders', ...auth, ctrl.orders);

export default router;
