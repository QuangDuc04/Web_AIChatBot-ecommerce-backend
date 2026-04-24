import {
  IsUUID, IsString, IsOptional, IsEnum, MaxLength, IsEmail, IsNotEmpty, ValidateNested, IsArray, IsNumber, IsInt, Min, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../types/enums';

export class GuestAddressDto {
  @IsString({ message: 'Địa chỉ không được để trống' })
  @IsNotEmpty()
  street: string;

  @IsString({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsNotEmpty()
  city: string;

  @IsString({ message: 'Quận/Huyện không được để trống' })
  @IsNotEmpty()
  district: string;

  @IsString({ message: 'Phường/Xã không được để trống' })
  @IsNotEmpty()
  ward: string;
}

export class CheckoutItemDto {
  @IsUUID(undefined, { message: 'Product ID không hợp lệ' })
  productId: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'Variant ID không hợp lệ' })
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  buyingUnitType?: string;
}

export class CalculateCheckoutDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Giỏ hàng trống' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsOptional()
  @IsUUID(undefined, { message: 'Địa chỉ giao hàng không hợp lệ' })
  shippingAddressId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'Phương thức vận chuyển không hợp lệ' })
  shippingMethodId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuestAddressDto)
  guestAddress?: GuestAddressDto;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Giỏ hàng trống' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsOptional()
  @IsUUID(undefined, { message: 'Phương thức vận chuyển không hợp lệ' })
  shippingMethodId?: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  // Guest checkout fields (required)
  @IsString({ message: 'Họ tên không được để trống' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  guestName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  guestEmail: string;

  @IsString({ message: 'Số điện thoại không được để trống' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  guestPhone: string;

  @ValidateNested()
  @Type(() => GuestAddressDto)
  guestAddress: GuestAddressDto;
}
