import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { uploadMultiple } from '../middlewares/upload.middleware';
import { CreateReviewDto, UpdateReviewDto, ReplyReviewDto } from '../dtos/review.dto';
import { UserRole } from '../types/enums';

const router = Router();
const ctrl = new ReviewController();

// Public
router.get('/product/:productId', ctrl.getProductReviews);
router.get('/product/:productId/stats', ctrl.getRatingStats);
router.get('/:id', ctrl.getOne);

// Authenticated
router.post('/', authenticateCustomer, uploadMultiple, validateBody(CreateReviewDto), ctrl.create);
router.put('/:id', authenticateCustomer, validateBody(UpdateReviewDto), ctrl.update);
router.delete('/:id', authenticateCustomer, ctrl.delete);
router.post('/:id/helpful', authenticateCustomer, ctrl.markHelpful);

// Admin/Staff
router.post('/:id/reply', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), validateBody(ReplyReviewDto), ctrl.reply);
router.delete('/replies/:replyId', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), ctrl.deleteReply);

export default router;
