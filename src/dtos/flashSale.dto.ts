import {
  IsString, IsUUID, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max, MinLength, MaxLength, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFlashSaleDto {
  @IsString() @MinLength(3) @MaxLength(100)
  name: string;

  @IsOptional() @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional() @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;

  /** Alias cho startDate (FE compat) */
  @IsOptional() @IsDateString()
  startTime?: string;

  /** Alias cho endDate (FE compat) */
  @IsOptional() @IsDateString()
  endTime?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  /** Alias cho isActive (FE compat) */
  @IsOptional() @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number)
  discountPercentage?: number;
}

export class UpdateFlashSaleDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100)
  name?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  /** Alias cho startDate (FE compat) */
  @IsOptional() @IsDateString()
  startTime?: string;

  /** Alias cho endDate (FE compat) */
  @IsOptional() @IsDateString()
  endTime?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  /** Alias cho isActive (FE compat) */
  @IsOptional() @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number)
  discountPercentage?: number;
}

export class CreateFlashSaleItemDto {
  @IsUUID(undefined, { message: 'productId không hợp lệ' })
  productId: string;

  @IsOptional() @IsUUID()
  variantId?: string;

  @IsNumber() @Min(1) @Max(99) @Type(() => Number)
  discountPercent: number;

  @IsNumber() @Min(1) @Type(() => Number)
  quantity: number;
}

export class UpdateFlashSaleItemDto {
  @IsOptional() @IsNumber() @Min(1) @Max(99) @Type(() => Number)
  discountPercent?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  quantity?: number;
}
