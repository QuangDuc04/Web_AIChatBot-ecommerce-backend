import { Router } from 'express';
import { OrderConfirmationController } from '../controllers/orderConfirmation.controller';

const router = Router();
const ctrl = new OrderConfirmationController();

router.get('/:token', ctrl.getByToken);
router.post('/:token/confirm', ctrl.confirm);

export default router;
