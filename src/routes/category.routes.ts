import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { uploadCategoryFiles } from '../middlewares/upload.middleware';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { UserRole } from '../types/enums';

const router = Router();
const ctrl = new CategoryController();

// Public
router.get('/', ctrl.getAll);
router.get('/tree', ctrl.getTree);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id', ctrl.getOne);

// Admin
router.post('/', authenticate, authorize(UserRole.ADMIN), uploadCategoryFiles, validateBody(CreateCategoryDto), ctrl.create);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), uploadCategoryFiles, validateBody(UpdateCategoryDto), ctrl.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.delete);

export default router;
