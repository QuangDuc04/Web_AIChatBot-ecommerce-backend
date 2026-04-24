import { Router } from 'express';
import { AdminFlashSaleController } from '../../controllers/admin/flashSale.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { CreateFlashSaleDto, UpdateFlashSaleDto, CreateFlashSaleItemDto, UpdateFlashSaleItemDto } from '../../dtos/flashSale.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminFlashSaleController();
const auth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...auth, ctrl.getAll);
router.get('/:id', ...auth, ctrl.getOne);
router.post('/', ...auth, validateBody(CreateFlashSaleDto), ctrl.create);
router.put('/:id', ...auth, validateBody(UpdateFlashSaleDto), ctrl.update);
router.delete('/:id', ...auth, ctrl.delete);
router.post('/:flashSaleId/items', ...auth, validateBody(CreateFlashSaleItemDto), ctrl.addItem);
router.put('/items/:itemId', ...auth, validateBody(UpdateFlashSaleItemDto), ctrl.updateItem);
router.delete('/items/:itemId', ...auth, ctrl.removeItem);

export default router;
