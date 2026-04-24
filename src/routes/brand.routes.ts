import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dto';
import { UserRole } from '../types/enums';

const router = Router();
const ctrl = new BrandController();

// Public
router.get('/', ctrl.getAll);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id', ctrl.getOne);

// Admin
router.post('/', authenticate, authorize(UserRole.ADMIN), uploadSingle, validateBody(CreateBrandDto), ctrl.create);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), uploadSingle, validateBody(UpdateBrandDto), ctrl.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.delete);

export default router;
