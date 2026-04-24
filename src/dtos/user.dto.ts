import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { AddressType } from '../types/enums';

const VN_PHONE_REGEX = /^(\+84|0)(3|5|7|8|9)\d{8}$/;
const VN_PHONE_MESSAGE = 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ phải là chuỗi' })
  @MinLength(2, { message: 'Họ phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Họ không được quá 50 ký tự' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone?: string;
}

export class CreateAddressDto {
  @IsString({ message: 'Họ tên không được để trống' })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @IsString({ message: 'Số điện thoại không được để trống' })
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone: string;

  @IsString({ message: 'Địa chỉ không được để trống' })
  street: string;

  @IsString({ message: 'Tỉnh/Thành phố không được để trống' })
  city: string;

  @IsString({ message: 'Quận/Huyện không được để trống' })
  district: string;

  @IsString({ message: 'Phường/Xã không được để trống' })
  ward: string;

  @IsOptional()
  @IsEnum(AddressType, { message: 'Loại địa chỉ không hợp lệ' })
  type?: AddressType;

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ phải là số' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ phải là số' })
  longitude?: number;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsEnum(AddressType, { message: 'Loại địa chỉ không hợp lệ' })
  type?: AddressType;

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ phải là số' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ phải là số' })
  longitude?: number;
}
