import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { CreatePaymentDto } from '../dtos/payment.dto';

const router = Router();
const ctrl = new PaymentController();

router.post('/create', authenticateCustomer, validateBody(CreatePaymentDto), ctrl.createPayment);
router.get('/vnpay/return', ctrl.vnpayReturn);
router.post('/vnpay/ipn', ctrl.vnpayIPN);
router.get('/momo/return', ctrl.momoReturn);
router.post('/momo/notify', ctrl.momoNotify);
router.get('/status/:orderId', authenticateCustomer, ctrl.getPaymentStatus);

export default router;
