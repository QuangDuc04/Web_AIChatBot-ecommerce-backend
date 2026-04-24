import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { optionalCustomerAuth } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { uploadMultiple } from '../middlewares/upload.middleware';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from '../dtos/product.dto';
import { UserRole } from '../types/enums';

const router = Router();
const ctrl = new ProductController();
const staffRoles = [UserRole.ADMIN, UserRole.STAFF];

// Public
router.get('/', ctrl.getAll);
router.get('/featured', ctrl.getFeatured);
router.get('/best-sellers', ctrl.getBestSellers);
router.get('/search', ctrl.search);
router.get('/slug/:slug', optionalCustomerAuth, ctrl.getBySlug);
router.get('/:id', optionalCustomerAuth, ctrl.getOne);
router.get('/:id/related', ctrl.getRelated);

// Admin/Staff - Product CRUD
router.post('/', authenticate, authorize(...staffRoles), uploadMultiple, validateBody(CreateProductDto), ctrl.create);
router.put('/:id', authenticate, authorize(...staffRoles), validateBody(UpdateProductDto), ctrl.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.delete);

// Admin/Staff - Images
router.post('/:id/images', authenticate, authorize(...staffRoles), uploadMultiple, ctrl.uploadImages);
router.delete('/:id/images/:imageId', authenticate, authorize(...staffRoles), ctrl.deleteImage);
router.put('/:id/images/:imageId/primary', authenticate, authorize(...staffRoles), ctrl.setPrimaryImage);
router.put('/:id/images/reorder', authenticate, authorize(...staffRoles), ctrl.reorderImages);

// Admin/Staff - Variants
router.post('/:id/variants', authenticate, authorize(...staffRoles), validateBody(CreateProductVariantDto), ctrl.createVariant);
router.put('/variants/:variantId', authenticate, authorize(...staffRoles), validateBody(UpdateProductVariantDto), ctrl.updateVariant);
router.delete('/variants/:variantId', authenticate, authorize(...staffRoles), ctrl.deleteVariant);

export default router;
