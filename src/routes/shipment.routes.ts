import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';

const router = Router();
const ctrl = new ShipmentController();

router.use(authenticateCustomer);
router.get('/track/:orderId', ctrl.trackShipment);

export default router;
