import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { UpdateNotificationSettingsDto } from '../dtos/notification.dto';

const router = Router();
const ctrl = new NotificationController();

router.use(authenticateCustomer);

router.get('/', ctrl.getAll);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/mark-all-read', ctrl.markAllAsRead);
router.get('/settings', ctrl.getSettings);
router.put('/settings', validateBody(UpdateNotificationSettingsDto), ctrl.updateSettings);
router.put('/:id/read', ctrl.markAsRead);
router.delete('/:id', ctrl.delete);

export default router;
