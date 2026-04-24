import {
  IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray,
  IsDateString, MinLength, MaxLength, Min, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../types/enums';

export class ValidateCouponDto {
  @IsString({ message: 'Mã giảm giá không được để trống' })
  code: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal?: number;
}

export class CreateCouponDto {
  @IsString()
  @MinLength(3, { message: 'Mã giảm giá phải có ít nhất 3 ký tự' })
  @MaxLength(20, { message: 'Mã giảm giá không được quá 20 ký tự' })
  code: string;

  @IsString()
  @MinLength(3, { message: 'Tên phải có ít nhất 3 ký tự' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType, { message: 'Loại coupon không hợp lệ' })
  type: CouponType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userUsageLimit?: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;

  @IsOptional()
  @IsArray()
  applicableProducts?: string[];

  @IsOptional()
  @IsArray()
  applicableCategories?: string[];

  /** Alias cho minOrderValue (FE compat) */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  /** Alias cho isActive (FE compat) */
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class UpdateCouponDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(20)
  code?: string;

  @IsOptional() @IsString() @MinLength(3) @MaxLength(100)
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  value?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  minOrderValue?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  maxDiscount?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  usageLimit?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  userUsageLimit?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsArray()
  applicableProducts?: string[];

  @IsOptional() @IsArray()
  applicableCategories?: string[];

  /** Alias cho minOrderValue (FE compat) */
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  minOrderAmount?: number;

  /** Alias cho isActive (FE compat) */
  @IsOptional() @IsIn(['active', 'inactive'])
  status?: string;
}
