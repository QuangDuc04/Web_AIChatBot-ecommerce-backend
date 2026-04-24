import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticateCustomer, optionalCustomerAuth } from '../middlewares/customerAuth.middleware';

const router = Router();
const ctrl = new SearchController();

router.get('/', optionalCustomerAuth, ctrl.search);
router.get('/suggestions', ctrl.suggestions);
router.get('/recent', authenticateCustomer, ctrl.recent);
router.delete('/history', authenticateCustomer, ctrl.deleteHistory);
router.get('/popular', ctrl.popular);
router.get('/trending', ctrl.trending);

export default router;
