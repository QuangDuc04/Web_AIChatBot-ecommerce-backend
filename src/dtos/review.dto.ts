import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsUUID(undefined, { message: 'productId không hợp lệ' })
  productId: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'orderId không hợp lệ' })
  orderId?: string;

  @IsNumber({}, { message: 'Rating phải là số' })
  @Min(1, { message: 'Rating tối thiểu là 1' })
  @Max(5, { message: 'Rating tối đa là 5' })
  @Type(() => Number)
  rating: number;

  @IsString({ message: 'Nội dung đánh giá không được để trống' })
  @MinLength(10, { message: 'Nội dung đánh giá phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Nội dung đánh giá không được quá 1000 ký tự' })
  comment: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Nội dung đánh giá phải có ít nhất 10 ký tự' })
  @MaxLength(1000)
  comment?: string;
}

export class ReplyReviewDto {
  @IsString({ message: 'Nội dung phản hồi không được để trống' })
  @MinLength(1, { message: 'Nội dung phản hồi không được để trống' })
  @MaxLength(500, { message: 'Nội dung phản hồi không được quá 500 ký tự' })
  comment: string;
}
