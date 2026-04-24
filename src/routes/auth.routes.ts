import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiter.middleware';
import {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dtos/auth.dto';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', registerLimiter, validateBody(RegisterDto), controller.register);
router.post('/login', validateBody(LoginDto), controller.login);
router.post('/google-login', loginLimiter, validateBody(GoogleLoginDto), controller.googleLogin);
router.post('/refresh-token', validateBody(RefreshTokenDto), controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/verify-email', validateBody(VerifyEmailDto), controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/forgot-password', validateBody(ForgotPasswordDto), controller.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordDto), controller.resetPassword);

// Protected routes
router.post('/change-password', authenticate, validateBody(ChangePasswordDto), controller.changePassword);
router.get('/me', authenticate, controller.getMe);

export default router;
