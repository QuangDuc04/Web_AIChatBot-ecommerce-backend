// @ts-nocheck — Dead file: customer auth removed (guest-only checkout)
import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { UserRepository } from '../repositories/user.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { UnauthorizedError } from '../errors';
import { AuthService } from '../services/auth.service';

const userRepo = new UserRepository();
const customerRepo = new CustomerRepository();

/**
 * Accepts both admin/staff tokens and customer tokens.
 * Sets req.user (admin/staff) or req.customer depending on actorType.
 */
export async function authenticateAny(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token không được cung cấp');
    }

    const token = authHeader.split(' ')[1];

    if (await AuthService.isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Phiên đăng nhập đã kết thúc');
    }

    const payload = JwtUtil.verifyAccessToken(token);

    if (payload.actorType === 'customer') {
      const customer = await customerRepo.findById(payload.userId);
      if (!customer) throw new UnauthorizedError('Khách hàng không tồn tại');
      if (!customer.isActive) throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
      req.customer = customer;
    } else {
      const user = await userRepo.findById(payload.userId);
      if (!user) throw new UnauthorizedError('Người dùng không tồn tại');
      if (!user.isActive) throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
      req.user = user;
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn'));
    }
  }
}
