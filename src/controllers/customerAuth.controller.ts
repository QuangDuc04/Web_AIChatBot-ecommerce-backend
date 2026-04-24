// @ts-nocheck — Dead file: customer auth removed (guest-only checkout)
import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from '../services/customerAuth.service';
import { ResponseUtil } from '../utils/response.util';

const customerAuthService = new CustomerAuthService();

export class CustomerAuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const device = req.headers['user-agent'];
      const result = await customerAuthService.register(req.body, userAgent, ipAddress, device);
      ResponseUtil.created(res, result, 'Đăng ký thành công');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const device = req.headers['user-agent'];
      const result = await customerAuthService.login(req.body, userAgent, ipAddress, device);
      ResponseUtil.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const device = req.headers['user-agent'];
      const result = await customerAuthService.googleLogin(req.body, userAgent, ipAddress, device);
      ResponseUtil.success(res, result, 'Đăng nhập bằng Google thành công');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await customerAuthService.refreshToken(req.body.refreshToken);
      ResponseUtil.success(res, tokens, 'Làm mới token thành công');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      // Extract the current access token so it can be blacklisted
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;

      if (refreshToken) {
        await customerAuthService.logout(refreshToken, accessToken);
      } else if (accessToken) {
        // Even without a refresh token, blacklist the access token
        const { AuthService } = await import('../services/auth.service');
        await AuthService.blacklistAccessToken(accessToken);
      }

      ResponseUtil.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await customerAuthService.verifyEmail(req.body.token);
      ResponseUtil.success(res, null, 'Xác thực email thành công');
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      await customerAuthService.resendVerificationEmail(req.body.email);
      ResponseUtil.success(res, null, 'Đã gửi lại email xác thực');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await customerAuthService.forgotPassword(req.body.email);
      // Always return success to not reveal email existence
      ResponseUtil.success(res, null, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await customerAuthService.resetPassword(req.body.token, req.body.password);
      ResponseUtil.success(res, null, 'Đặt lại mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await customerAuthService.changePassword(
        req.customer!.id,
        req.body.currentPassword,
        req.body.newPassword,
      );
      ResponseUtil.success(res, null, 'Đổi mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, googleId, emailVerificationToken, passwordResetToken, passwordResetExpires, ...customer } = req.customer!;
      ResponseUtil.success(res, customer);
    } catch (error) {
      next(error);
    }
  }
}
