import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError, AppError } from '../errors';
import { UserRole } from '../types/enums';
import { AuthService } from '../services/auth.service';

const userRepo = new UserRepository();

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token không được cung cấp');
    }

    const token = authHeader.split(' ')[1];

    // Check if this token has been revoked (logout / password change)
    if (await AuthService.isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Phiên đăng nhập đã kết thúc');
    }

    const payload = JwtUtil.verifyAccessToken(token);

    const user = await userRepo.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('Người dùng không tồn tại');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn'));
    }
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
    }
    next();
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (await AuthService.isTokenBlacklisted(token)) {
      return next();
    }

    const payload = JwtUtil.verifyAccessToken(token);
    const user = await userRepo.findById(payload.userId);
    if (user?.isActive) {
      req.user = user;
    }
  } catch {
    // Ignore token errors for optional auth
  }
  next();
}
