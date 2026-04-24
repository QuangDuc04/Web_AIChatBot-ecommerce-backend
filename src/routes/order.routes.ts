import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const ctrl = new OrderController();

// Guest order lookup — no auth required
router.get('/lookup', ctrl.lookupOrder);
router.get('/lookup-by-contact', ctrl.lookupByContact);

export default router;
