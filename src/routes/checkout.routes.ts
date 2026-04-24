import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { CalculateCheckoutDto, CreateOrderDto } from '../dtos/checkout.dto';

const router = Router();
const ctrl = new CheckoutController();

// All checkout operations are guest-only (sessionId from x-session-id header)
router.post('/validate', ctrl.validate);
router.post('/calculate', validateBody(CalculateCheckoutDto), ctrl.calculate);
router.post('/create-order', validateBody(CreateOrderDto), ctrl.createOrder);

export default router;
