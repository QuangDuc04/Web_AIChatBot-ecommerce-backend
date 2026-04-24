import {
  IsUUID, IsString, IsOptional, IsEnum, IsDateString, IsArray, IsNumber, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatus } from '../types/enums';

export class CreateShipmentDto {
  @IsUUID(undefined, { message: 'orderId không hợp lệ' })
  orderId: string;

  @IsString({ message: 'Đơn vị vận chuyển không được để trống' })
  carrier: string;

  @IsString({ message: 'Mã vận đơn không được để trống' })
  trackingNumber: string;

  @IsDateString({}, { message: 'Ngày giao dự kiến không hợp lệ' })
  estimatedDeliveryAt: string;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsEnum(ShipmentStatus, { message: 'Trạng thái vận chuyển không hợp lệ' })
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  failedReason?: string;

  @IsOptional()
  @IsArray()
  deliveryImages?: string[];
}

export class AddShippingUpdateDto {
  @IsUUID(undefined, { message: 'shipmentId không hợp lệ' })
  shipmentId: string;

  @IsString({ message: 'Trạng thái không được để trống' })
  status: string;

  @IsString({ message: 'Vị trí không được để trống' })
  location: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ShipmentFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;
}
