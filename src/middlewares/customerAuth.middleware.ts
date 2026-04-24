// @ts-nocheck — Dead file: customer auth removed (guest-only checkout)
import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { CustomerRepository } from '../repositories/customer.repository';
import { UnauthorizedError } from '../errors';
import { AuthService } from '../services/auth.service';

const customerRepo = new CustomerRepository();

export async function authenticateCustomer(req: Request, _res: Response, next: NextFunction) {
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

    if (payload.actorType !== 'customer') {
      throw new UnauthorizedError('Token không hợp lệ');
    }

    const customer = await customerRepo.findById(payload.userId);
    if (!customer) {
      throw new UnauthorizedError('Khách hàng không tồn tại');
    }
    if (!customer.isActive) {
      throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn'));
    }
  }
}

export async function optionalCustomerAuth(req: Request, _res: Response, next: NextFunction) {
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

    if (payload.actorType !== 'customer') {
      return next();
    }

    const customer = await customerRepo.findById(payload.userId);
    if (customer?.isActive) {
      req.customer = customer;
    }
  } catch {
    // Ignore token errors for optional auth
  }
  next();
}
