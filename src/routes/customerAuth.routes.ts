// @ts-nocheck — Dead file: customer auth removed (guest-only checkout)
import { Router } from 'express';
import { CustomerAuthController } from '../controllers/customerAuth.controller';
import { authenticateCustomer } from '../middlewares/customerAuth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
} from '../dtos/auth.dto';

const router = Router();
const controller = new CustomerAuthController();

// Public routes
router.post('/register', validateBody(RegisterDto), controller.register);
router.post('/login', validateBody(LoginDto), controller.login);
router.post('/google-login', validateBody(GoogleLoginDto), controller.googleLogin);
router.post('/refresh-token', validateBody(RefreshTokenDto), controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/verify-email', validateBody(VerifyEmailDto), controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/forgot-password', validateBody(ForgotPasswordDto), controller.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordDto), controller.resetPassword);

// Protected routes
router.post('/change-password', authenticateCustomer, validateBody(ChangePasswordDto), controller.changePassword);
router.get('/me', authenticateCustomer, controller.getMe);

export default router;
