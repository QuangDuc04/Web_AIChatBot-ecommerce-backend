import {
  IsUUID, IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max, MinLength, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '../types/enums';

export class CreatePaymentDto {
  @IsUUID(undefined, { message: 'orderId không hợp lệ' })
  orderId: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsString()
  @MinLength(5, { message: 'Lý do hoàn tiền phải có ít nhất 5 ký tự' })
  @MaxLength(500)
  reason: string;
}

export class PaymentFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional() @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;
}
