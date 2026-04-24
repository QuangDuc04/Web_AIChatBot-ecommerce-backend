import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateBrandDto {
  @IsString({ message: 'Tên thương hiệu phải là chuỗi' })
  @MinLength(2, { message: 'Tên thương hiệu phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên thương hiệu không được quá 100 ký tự' })
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên thương hiệu phải có ít nhất 2 ký tự' })
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
