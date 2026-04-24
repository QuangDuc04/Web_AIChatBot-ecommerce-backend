import { Router } from 'express';
import { AdminShipmentController } from '../../controllers/admin/shipment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { CreateShipmentDto, UpdateShipmentDto, AddShippingUpdateDto } from '../../dtos/shipment.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminShipmentController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.post('/', ...staffAuth, validateBody(CreateShipmentDto), ctrl.create);
router.put('/:id', ...staffAuth, validateBody(UpdateShipmentDto), ctrl.update);
router.post('/update', ...staffAuth, validateBody(AddShippingUpdateDto), ctrl.addUpdate);
router.put('/:id/deliver', ...staffAuth, ctrl.markDelivered);
router.put('/:id/fail', ...staffAuth, ctrl.markFailed);

export default router;
