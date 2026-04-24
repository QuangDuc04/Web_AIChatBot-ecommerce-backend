import { Router } from 'express';
import { AdminInventoryController } from '../../controllers/admin/inventory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminInventoryController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/transactions', ...staffAuth, ctrl.getAllTransactions);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.put('/:id/stock', ...staffAuth, ctrl.updateStock);
router.post('/:id/restock', ...staffAuth, ctrl.restock);
router.post('/:id/adjust', ...staffAuth, ctrl.adjust);
router.get('/:id/transactions', ...staffAuth, ctrl.getTransactions);

export default router;
