import {
  IsString, IsUUID, IsOptional, IsEnum, IsObject, IsBoolean, IsNumber, Min, Max,
  MinLength, MaxLength, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../types/enums';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'userId không hợp lệ' })
  userId?: string;

  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  type: NotificationType;

  @IsString() @MinLength(3) @MaxLength(100)
  title: string;

  @IsString() @MinLength(1) @MaxLength(500)
  message: string;

  /** Alias cho message (FE compat) */
  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsObject()
  data?: Record<string, unknown>;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsString()
  url?: string;

  /** Alias cho url (FE compat) */
  @IsOptional() @IsString()
  link?: string;
}

export class BulkNotificationDto {
  @IsOptional()
  @IsArray()
  userIds?: string[];

  /** Gửi đến tất cả user theo role; nếu trống = tất cả người dùng */
  @IsOptional() @IsString()
  role?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString() @MinLength(3) @MaxLength(100)
  title: string;

  @IsString() @MinLength(1) @MaxLength(500)
  message: string;

  /** Alias cho message (FE compat) */
  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsObject()
  data?: Record<string, unknown>;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsString()
  url?: string;

  /** Alias cho url (FE compat) */
  @IsOptional() @IsString()
  link?: string;
}

export class UpdateNotificationSettingsDto {
  @IsOptional() @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional() @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional() @IsBoolean()
  orderUpdates?: boolean;

  @IsOptional() @IsBoolean()
  promotions?: boolean;

  @IsOptional() @IsBoolean()
  newMessages?: boolean;
}

export class NotificationFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  isRead?: boolean;
}
