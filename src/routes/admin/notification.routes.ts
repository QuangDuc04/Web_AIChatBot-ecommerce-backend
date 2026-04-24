import { Router } from 'express';
import { AdminNotificationController } from '../../controllers/admin/notification.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { CreateNotificationDto, BulkNotificationDto } from '../../dtos/notification.dto';
import { UserRole } from '../../types/enums';

const router = Router();
const ctrl = new AdminNotificationController();

router.use(authenticate, authorize(UserRole.ADMIN, UserRole.STAFF));

// Admin's own notifications (list, read, mark)
router.get('/me', ctrl.getMyNotifications);
router.get('/me/unread-count', ctrl.getMyUnreadCount);
router.put('/me/mark-all-read', ctrl.markAllAsRead);
router.put('/me/:id/read', ctrl.markAsRead);
router.delete('/me/:id', ctrl.deleteNotification);

// Send notifications to customers (admin-only)
router.post('/', validateBody(CreateNotificationDto), ctrl.create);
router.post('/bulk', validateBody(BulkNotificationDto), ctrl.createBulk);

export default router;
