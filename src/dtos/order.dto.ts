import {
  IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max, MinLength, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../types/enums';

export class OrderFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional() @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional() @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsString()
  search?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CancelOrderDto {
  @IsString({ message: 'Lý do hủy không được để trống' })
  @MinLength(10, { message: 'Lý do hủy phải có ít nhất 10 ký tự' })
  @MaxLength(500)
  cancelReason: string;
}
