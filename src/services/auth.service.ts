import { UserRepository } from '../repositories/user.repository';
import { UserSessionRepository } from '../repositories/userSession.repository';
import { RegisterDto, LoginDto, GoogleLoginDto } from '../dtos/auth.dto';
import { JwtUtil } from '../utils/jwt.util';
import { BcryptUtil } from '../utils/bcrypt.util';
import { EmailUtil } from '../utils/email.util';
import { AppError, UnauthorizedError } from '../errors';
import { UserRole, AuthProvider } from '../types/enums';
import { JwtPayload, TokenPair } from '../types/jwt.types';
import { User } from '../entities/User';
import { OAuth2Client } from 'google-auth-library';
import { CacheUtil } from '../utils/cache.util';

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new UserSessionRepository();

  async register(dto: RegisterDto) {
    // Check email exists
    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new AppError('Email đã được sử dụng', 400);
    }

    // Check phone exists
    if (dto.phone) {
      const existingPhone = await this.userRepo.findByPhone(dto.phone);
      if (existingPhone) {
        throw new AppError('Số điện thoại đã được sử dụng', 400);
      }
    }

    // Hash password
    const hashedPassword = await BcryptUtil.hash(dto.password);

    // Generate email verification token
    const emailVerificationToken = JwtUtil.generateEmailVerificationToken();

    // Create admin/staff user (admin auth register is for staff accounts only)
    const user = await this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || undefined,
      role: UserRole.STAFF,
      emailVerificationToken,
    });

    // Send verification email (non-blocking)
    EmailUtil.sendVerificationEmail(user.email, emailVerificationToken).catch((err) =>
      console.error('Gửi email xác thực thất bại:', err.message),
    );

    // Generate tokens — admin auth always sets actorType: 'user'
    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role, actorType: 'user' };
    const tokens = JwtUtil.generateTokenPair(payload);

    // Save session
    await this.saveSession(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), tokens };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    // Find user
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // Check active
    if (!user.isActive) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Guard: Google-only accounts have no password
    if (!user.password) {
      throw new AppError('Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google.', 400);
    }

    // Verify password
    const isValid = await BcryptUtil.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // Generate tokens — admin auth always sets actorType: 'user'
    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role, actorType: 'user' };
    const tokens = JwtUtil.generateTokenPair(payload);

    // Save session
    await this.saveSession(user.id, tokens.refreshToken, userAgent, ipAddress);

    // Update last seen
    await this.userRepo.updateLastSeen(user.id);

    return { user: this.sanitizeUser(user), tokens };
  }

  async refreshToken(refreshToken: string) {
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
      role: payload.role,
      actorType: 'user',
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

  /**
   * Adds an access token to the Redis blacklist.
   * TTL is set to the token's remaining lifetime (at most 15 minutes).
   */
  static async blacklistAccessToken(token: string): Promise<void> {
    try {
      const payload = JwtUtil.verifyAccessToken(token);
      const exp = (payload as any).exp;
      if (!exp) return;

      const ttl = exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await CacheUtil.set(`bl:${token}`, '1', ttl);
      }
    } catch {
      // Token already expired or invalid — no need to blacklist
    }
  }

  /**
   * Returns true if the given access token has been blacklisted (logged-out).
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    return CacheUtil.exists(`bl:${token}`);
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findByEmailVerificationToken(token);
    if (!user) {
      throw new AppError('Token xác thực không hợp lệ hoặc đã hết hạn', 400);
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
    } as Partial<User>);

    // Send welcome email (non-blocking)
    EmailUtil.sendWelcomeEmail(user.email, user.firstName).catch((err) =>
      console.error('Gửi email chào mừng thất bại:', err.message),
    );
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản với email này', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email đã được xác thực', 400);
    }

    const token = JwtUtil.generateEmailVerificationToken();
    await this.userRepo.update(user.id, { emailVerificationToken: token });

    await EmailUtil.sendVerificationEmail(user.email, token);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    // Don't reveal if email exists
    if (!user) return;

    const token = JwtUtil.generatePasswordResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    await EmailUtil.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findByPasswordResetToken(token);
    if (!user) {
      throw new AppError('Token đặt lại mật khẩu không hợp lệ', 400);
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new AppError('Token đặt lại mật khẩu đã hết hạn', 400);
    }

    const hashedPassword = await BcryptUtil.hash(newPassword);

    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    } as Partial<User>);

    // Force re-login
    await this.sessionRepo.deleteUserSessions(user.id);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findByIdOrFail(userId);

    if (!user.password) {
      throw new AppError('Tài khoản Google không có mật khẩu. Vui lòng sử dụng chức năng đặt lại mật khẩu.', 400);
    }

    const isValid = await BcryptUtil.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400);
    }

    const hashedPassword = await BcryptUtil.hash(newPassword);
    await this.userRepo.update(userId, { password: hashedPassword });

    // Force re-login
    await this.sessionRepo.deleteUserSessions(userId);
  }

  async googleLogin(dto: GoogleLoginDto, userAgent?: string, ipAddress?: string) {
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

    // Try to find existing user by googleId, then by email
    let user = await this.userRepo.findByGoogleId(googleId!);

    if (!user) {
      user = await this.userRepo.findByEmail(email);

      if (user) {
        // Link Google to existing account
        await this.userRepo.update(user.id, { googleId: googleId! });
        user.googleId = googleId!;
      } else {
        // Create new user from Google profile
        user = await this.userRepo.create({
          email,
          password: null,
          googleId: googleId!,
          authProvider: AuthProvider.GOOGLE,
          firstName: given_name || email.split('@')[0],
          lastName: family_name || '',
          avatar: picture || undefined,
          role: UserRole.STAFF,
          emailVerified: true,
        });
      }
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Generate tokens
    const jwtPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role, actorType: 'user' };
    const tokens = JwtUtil.generateTokenPair(jwtPayload);

    await this.saveSession(user.id, tokens.refreshToken, userAgent, ipAddress);
    await this.userRepo.updateLastSeen(user.id);

    return { user: this.sanitizeUser(user), tokens };
  }

  // --- Helpers ---

  private async saveSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepo.create({
      userId,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  private sanitizeUser(user: User) {
    const { password, googleId, emailVerificationToken, passwordResetToken, passwordResetExpires, ...safe } = user;
    return safe;
  }
}
