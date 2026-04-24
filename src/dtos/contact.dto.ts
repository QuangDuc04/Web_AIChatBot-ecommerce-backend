import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ContactType, ContactStatus } from '../entities/ContactSubmission';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;
}

export class UpdateContactStatusDto {
  @IsEnum(ContactStatus, { message: 'Trạng thái không hợp lệ' })
  status: ContactStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
