import { Router } from 'express';
import { GuestChatController } from '../controllers/guestChat.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { StartGuestChatDto, GuestMessageDto } from '../dtos/guestChat.dto';

const router = Router();
const ctrl = new GuestChatController();

// Public guest chat routes (no auth required)
router.post('/start', validateBody(StartGuestChatDto), ctrl.start);
router.get('/:id/messages', ctrl.getMessages);
router.post('/:id/messages', validateBody(GuestMessageDto), ctrl.sendMessage);

export default router;
