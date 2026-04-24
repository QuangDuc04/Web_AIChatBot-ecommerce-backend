// @ts-nocheck — Dead file: customer auth removed (guest-only checkout)
import { CustomerRepository } from '../repositories/customer.repository';
import { CustomerSessionRepository } from '../repositories/customerSession.repository';
import { RegisterDto, LoginDto, GoogleLoginDto } from '../dtos/auth.dto';
import { JwtUtil } from '../utils/jwt.util';
import { BcryptUtil } from '../utils/bcrypt.util';
import { EmailUtil } from '../utils/email.util';
import { AppError, UnauthorizedError } from '../errors';
import { AuthProvider } from '../types/enums';
import { JwtPayload, TokenPair } from '../types/jwt.types';
import { Customer } from '../entities/Customer';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from './auth.service';

export class CustomerAuthService {
  private customerRepo = new CustomerRepository();
  private sessionRepo = new CustomerSessionRepository();

  async register(dto: RegisterDto, userAgent?: string, ipAddress?: string, device?: string) {
    // Check email exists
    const existingEmail = await this.customerRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new AppError('Email đã được sử dụng', 400);
    }

    // Check phone exists
    if (dto.phone) {
      const existingPhone = await this.customerRepo.findByPhone(dto.phone);
      if (existingPhone) {
        throw new AppError('Số điện thoại đã được sử dụng', 400);
      }
    }

    // Hash password
    const hashedPassword = await BcryptUtil.hash(dto.password);

    // Generate email verification token
    const emailVerificationToken = JwtUtil.generateEmailVerificationToken();

    // Create customer
    const customer = await this.customerRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || undefined,
      emailVerificationToken,
    });

    // Send verification email (non-blocking)
    EmailUtil.sendVerificationEmail(customer.email, emailVerificationToken).catch((err) =>
      console.error('Gửi email xác thực thất bại:', err.message),
    );

    // Generate tokens
    const payload: JwtPayload = {
      userId: customer.id,
      email: customer.email,
      role: 'customer' as any,
      actorType: 'customer',
    };
    const tokens = JwtUtil.generateTokenPair(payload);

    // Save session
    await this.saveSession(customer.id, tokens.refreshToken, userAgent, ipAddress, device);

    return { customer: this.sanitizeCustomer(customer), tokens };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string, device?: string) {
    // Find customer
    const customer = await this.customerRepo.findByEmail(dto.email);
    if (!customer) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // Check active
    if (!customer.isActive) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Guard: Google-only accounts have no password
    if (!customer.password) {
      throw new AppError('Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google.', 400);
    }

    // Verify password
    const isValid = await BcryptUtil.compare(dto.password, customer.password);
    if (!isValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: customer.id,
      email: customer.email,
      role: 'customer' as any,
      actorType: 'customer',
    };
    const tokens = JwtUtil.generateTokenPair(payload);

    // Save session
    await this.saveSession(customer.id, tokens.refreshToken, userAgent, ipAddress, device);

    // Update last seen with device and ip
    await this.customerRepo.updateLastSeen(customer.id, ipAddress, device);

    return { customer: this.sanitizeCustomer(customer), tokens };
  }

  async googleLogin(dto: GoogleLoginDto, userAgent?: string, ipAddress?: string, device?: string) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError('Google token không hợp lệ', 400);
    }

    if (!payload || !payload.email || !payload.email_verified) {
      throw new AppError('Email Google chưa được xác thực', 400);
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Try to find existing customer by googleId, then by email
    let customer = await this.customerRepo.findByGoogleId(googleId!);

    if (!customer) {
      customer = await this.customerRepo.findByEmail(email);

      if (customer) {
        // Link Google to existing account
        await this.customerRepo.update(customer.id, { googleId: googleId! });
        customer.googleId = googleId!;
      } else {
        // Create new customer from Google profile
        customer = await this.customerRepo.create({
          email,
          password: null,
          googleId: googleId!,
          authProvider: AuthProvider.GOOGLE,
          firstName: given_name || email.split('@')[0],
          lastName: family_name || '',
          avatar: picture || undefined,
          emailVerified: true,
        });
      }
    }

    if (!customer.isActive) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: customer.id,
      email: customer.email,
      role: 'customer' as any,
      actorType: 'customer',
    };
    const tokens = JwtUtil.generateTokenPair(jwtPayload);

    await this.saveSession(customer.id, tokens.refreshToken, userAgent, ipAddress, device);
    await this.customerRepo.updateLastSeen(customer.id, ipAddress, device);

    return { customer: this.sanitizeCustomer(customer), tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // Verify token
    let payload: JwtPayload;
    try {
      payload = JwtUtil.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token không hợp lệ');
    }

    // Find session
    const session = await this.sessionRepo.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedError('Phiên đăng nhập không tồn tại');
    }

    // Check expired
    if (session.expiresAt < new Date()) {
      await this.sessionRepo.deleteByRefreshToken(refreshToken);
      throw new UnauthorizedError('Phiên đăng nhập đã hết hạn');
    }

    // Generate new tokens
    const newPayload: JwtPayload = {
      userId: payload.userId,
      email: payload.email,
      role: 'customer' as any,
      actorType: 'customer',
    };
    const tokens = JwtUtil.generateTokenPair(newPayload);

    // Delete old, create new session
    await this.sessionRepo.deleteByRefreshToken(refreshToken);
    await this.saveSession(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string, accessToken?: string) {
    await this.sessionRepo.deleteByRefreshToken(refreshToken);

    // Blacklist the current access token so it cannot be reused
    if (accessToken) {
      await AuthService.blacklistAccessToken(accessToken);
    }
  }

  async verifyEmail(token: string) {
    const customer = await this.customerRepo.findByEmailVerificationToken(token);
    if (!customer) {
      throw new AppError('Token xác thực không hợp lệ hoặc đã hết hạn', 400);
    }

    await this.customerRepo.update(customer.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
    } as Partial<Customer>);

    // Send welcome email (non-blocking)
    EmailUtil.sendWelcomeEmail(customer.email, customer.firstName).catch((err) =>
      console.error('Gửi email chào mừng thất bại:', err.message),
    );
  }

  async resendVerificationEmail(email: string) {
    const customer = await this.customerRepo.findByEmail(email);
    if (!customer) {
      throw new AppError('Không tìm thấy tài khoản với email này', 404);
    }

    if (customer.emailVerified) {
      throw new AppError('Email đã được xác thực', 400);
    }

    const token = JwtUtil.generateEmailVerificationToken();
    await this.customerRepo.update(customer.id, { emailVerificationToken: token });

    await EmailUtil.sendVerificationEmail(customer.email, token);
  }

  async forgotPassword(email: string) {
    const customer = await this.customerRepo.findByEmail(email);
    // Don't reveal if email exists
    if (!customer) return;

    const token = JwtUtil.generatePasswordResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.customerRepo.update(customer.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    await EmailUtil.sendPasswordResetEmail(customer.email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const customer = await this.customerRepo.findByPasswordResetToken(token);
    if (!customer) {
      throw new AppError('Token đặt lại mật khẩu không hợp lệ', 400);
    }

    if (!customer.passwordResetExpires || customer.passwordResetExpires < new Date()) {
      throw new AppError('Token đặt lại mật khẩu đã hết hạn', 400);
    }

    const hashedPassword = await BcryptUtil.hash(newPassword);

    await this.customerRepo.update(customer.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    } as Partial<Customer>);

    // Force re-login
    await this.sessionRepo.deleteCustomerSessions(customer.id);
  }

  async changePassword(customerId: string, currentPassword: string, newPassword: string) {
    const customer = await this.customerRepo.findByIdOrFail(customerId);

    if (!customer.password) {
      throw new AppError('Tài khoản Google không có mật khẩu. Vui lòng sử dụng chức năng đặt lại mật khẩu.', 400);
    }

    const isValid = await BcryptUtil.compare(currentPassword, customer.password);
    if (!isValid) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400);
    }

    const hashedPassword = await BcryptUtil.hash(newPassword);
    await this.customerRepo.update(customerId, { password: hashedPassword });

    // Force re-login
    await this.sessionRepo.deleteCustomerSessions(customerId);
  }

  // --- Helpers ---

  private async saveSession(
    customerId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
    device?: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepo.create({
      customerId,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
      device,
    });
  }

  private sanitizeCustomer(customer: Customer) {
    const { password, googleId, emailVerificationToken, passwordResetToken, passwordResetExpires, ...safe } = customer;
    return safe;
  }
}
