import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { CreateContactDto } from '../dtos/contact.dto';

const router = Router();
const ctrl = new ContactController();

// Public: submit contact form (no auth required)
router.post('/', validateBody(CreateContactDto), ctrl.submit);

export default router;
