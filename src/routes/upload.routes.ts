import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticateAny } from '../middlewares/anyAuth.middleware';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware';

const router = Router();
const ctrl = new UploadController();

router.use(authenticateAny);

router.post('/image', uploadSingle, ctrl.uploadImage);
router.post('/images', uploadMultiple, ctrl.uploadMultiple);
router.delete('/image', ctrl.deleteImage);

export default router;
