import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { uploadMultiple } from '../middlewares/upload.middleware';
import { CreateConversationDto } from '../dtos/conversation.dto';
import { SendMessageDto, EditMessageDto } from '../dtos/message.dto';

const router = Router();
const ctrl = new ConversationController();

router.use(authenticateCustomer);

router.get('/', ctrl.getMyConversations);
router.post('/', validateBody(CreateConversationDto), ctrl.create);
router.get('/:id', ctrl.getConversation);
router.put('/:id/close', ctrl.close);
router.get('/:id/messages', ctrl.getMessages);
router.post('/:id/messages', uploadMultiple, ctrl.sendMessage);
router.put('/messages/:messageId', validateBody(EditMessageDto), ctrl.editMessage);
router.delete('/messages/:messageId', ctrl.deleteMessage);
router.put('/:id/read', ctrl.markAsRead);

export default router;
