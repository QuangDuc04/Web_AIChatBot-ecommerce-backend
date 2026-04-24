import { Router } from 'express';
import { AdminBannerController } from '../../controllers/admin/banner.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { uploadSingle } from '../../middlewares/upload.middleware';
import { CreateBannerDto, UpdateBannerDto } from '../../dtos/banner.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminBannerController();
const auth = [authenticate, authorize(UserRole.ADMIN)];

router.get('/active', ctrl.getActive); // public
router.get('/', ...auth, ctrl.getAll);
router.post('/', ...auth, uploadSingle, validateBody(CreateBannerDto), ctrl.create);
router.put('/:id', ...auth, uploadSingle, validateBody(UpdateBannerDto), ctrl.update);
router.delete('/:id', ...auth, ctrl.delete);

export default router;
