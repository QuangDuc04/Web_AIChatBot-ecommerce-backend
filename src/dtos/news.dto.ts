import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min, MinLength, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateNewsDto {
  @IsString() @MinLength(5) @MaxLength(500)
  title: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString() @MaxLength(500)
  summary?: string;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsString()
  author?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  displayOrder?: number;

  @IsOptional() @IsDateString()
  publishedAt?: string;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  isActive?: boolean;

  @IsOptional() @IsString()
  tags?: string;
}

export class UpdateNewsDto {
  @IsOptional() @IsString() @MinLength(5) @MaxLength(500)
  title?: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString() @MaxLength(500)
  summary?: string;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsString()
  author?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  displayOrder?: number;

  @IsOptional() @IsDateString()
  publishedAt?: string;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  isActive?: boolean;

  @IsOptional() @IsString()
  tags?: string;
}
