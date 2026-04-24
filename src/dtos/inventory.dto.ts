import { IsUUID, IsInt, IsOptional, IsString, IsEnum, Min, MaxLength } from 'class-validator';
import { InventoryTransactionType } from '../types/enums';

export class UpdateStockDto {
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(0, { message: 'Số lượng không được âm' })
  quantity: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}

export class RestockDto {
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhập phải lớn hơn 0' })
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AdjustStockDto {
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  adjustment: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}

export class InventoryFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['all', 'low', 'out_of_stock'], { message: 'Trạng thái tồn kho không hợp lệ' })
  stockStatus?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
