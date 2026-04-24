import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, Min, MinLength, MaxLength, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BannerPlacement } from '../types/enums';

export class CreateBannerDto {
  @IsString() @MinLength(3) @MaxLength(100)
  title: string;

  @IsOptional() @IsString()
  link?: string;

  /** Alias cho link (FE compat) */
  @IsOptional() @IsString()
  linkUrl?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  displayOrder?: number;

  /** Alias cho displayOrder (FE compat) */
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  sortOrder?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsEnum(BannerPlacement, { message: 'Vị trí hiển thị không hợp lệ' })
  placement: BannerPlacement;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  isActive?: boolean;

  /** Alias cho isActive (FE compat) */
  @IsOptional() @IsIn(['active', 'inactive'])
  status?: string;

  /** Ignored — no DB field */
  @IsOptional() @IsString()
  subtitle?: string;
}

export class UpdateBannerDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100)
  title?: string;

  @IsOptional() @IsString()
  link?: string;

  /** Alias cho link (FE compat) */
  @IsOptional() @IsString()
  linkUrl?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  displayOrder?: number;

  /** Alias cho displayOrder (FE compat) */
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  sortOrder?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsEnum(BannerPlacement)
  placement?: BannerPlacement;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  isActive?: boolean;

  /** Alias cho isActive (FE compat) */
  @IsOptional() @IsIn(['active', 'inactive'])
  status?: string;

  /** Ignored — no DB field */
  @IsOptional() @IsString()
  subtitle?: string;
}
