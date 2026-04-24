import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, TokenPair } from '../types/jwt.types';

export class JwtUtil {
  private static get accessSecret(): string {
    return process.env.JWT_SECRET || 'default-secret';
  }

  private static get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  }

  private static get accessExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '15m';
  }

  private static get refreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload as object, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    } as SignOptions);
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload as object, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    } as SignOptions);
  }

  static generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, this.refreshSecret) as JwtPayload;
  }

  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
