import {
  IsString, IsNumber, IsOptional, IsUUID, IsArray, IsBoolean, Min, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateShippingDto {
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsUUID()
  shippingMethodId?: string;
}

export class CreateShippingMethodDto {
  @IsString()
  @MinLength(3, { message: 'Tên phương thức phải có ít nhất 3 ký tự' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPerKm?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  estimatedDays: number;

  @IsOptional()
  @IsArray()
  provinces?: string[];
}

export class UpdateShippingMethodDto {
  @IsOptional() @IsString() @MinLength(3)
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  baseCost?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  costPerKm?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  estimatedDays?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsArray()
  provinces?: string[];
}
