import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from '../dtos/user.dto';

const router = Router();
const controller = new UserController();

// All routes require authentication
router.use(authenticateCustomer);

// Profile
router.get('/profile', controller.getProfile);
router.put('/profile', validateBody(UpdateProfileDto), controller.updateProfile);

// Addresses
router.get('/addresses', controller.getAddresses);
router.get('/addresses/:id', controller.getAddress);
router.post('/addresses', validateBody(CreateAddressDto), controller.createAddress);
router.put('/addresses/:id', validateBody(UpdateAddressDto), controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);
router.put('/addresses/:id/default', controller.setDefaultAddress);

export default router;
