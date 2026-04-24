import { Router } from 'express';
import { AdminNewsController } from '../../controllers/admin/news.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { uploadSingle } from '../../middlewares/upload.middleware';
import { CreateNewsDto, UpdateNewsDto } from '../../dtos/news.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminNewsController();
const auth = [authenticate, authorize(UserRole.ADMIN)];

router.get('/active', ctrl.getActive); // public
router.get('/slug/:slug', ctrl.getBySlug); // public
router.get('/:id', ...auth, ctrl.getById);
router.get('/', ...auth, ctrl.getAll);
router.post('/', ...auth, uploadSingle, validateBody(CreateNewsDto), ctrl.create);
router.put('/:id', ...auth, uploadSingle, validateBody(UpdateNewsDto), ctrl.update);
router.delete('/:id', ...auth, ctrl.delete);

export default router;
