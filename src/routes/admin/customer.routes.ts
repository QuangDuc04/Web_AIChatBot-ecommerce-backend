import { Router } from 'express';
import { AdminCustomerController } from '../../controllers/admin/customer.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { uploadMultiple } from '../../middlewares/upload.middleware';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminCustomerController();
const staffAuth = [authenticate, authorize(UserRole.ADMIN, UserRole.STAFF)];

router.get('/', ...staffAuth, ctrl.getAll);
router.get('/stats', ...staffAuth, ctrl.getStats);
router.get('/:id', ...staffAuth, ctrl.getOne);
router.post('/', ...staffAuth, uploadMultiple, ctrl.create);
router.put('/:id', ...staffAuth, uploadMultiple, ctrl.update);
router.delete('/:id', ...staffAuth, ctrl.delete);
router.post('/:id/images', ...staffAuth, uploadMultiple, ctrl.uploadImages);
router.delete('/:id/images/:imageId', ...staffAuth, ctrl.deleteImage);
router.put('/:id/notes', ...staffAuth, ctrl.updateNotes);

export default router;
