import { Router } from 'express';
import { FlashSaleController } from '../controllers/flashSale.controller';

const router = Router();
const ctrl = new FlashSaleController();

router.get('/active', ctrl.getActive);
router.get('/:id', ctrl.getOne);

export default router;
