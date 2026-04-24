import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticateCustomer, optionalCustomerAuth } from '../middlewares/customerAuth.middleware';

const router = Router();
const ctrl = new RecommendationController();

router.get('/', authenticateCustomer, ctrl.recommended);
router.get('/related/:productId', ctrl.related);
router.get('/frequently-bought/:productId', ctrl.frequentlyBought);
router.get('/recently-viewed', optionalCustomerAuth, ctrl.recentlyViewed);
router.get('/new-arrivals', ctrl.newArrivals);

export default router;
