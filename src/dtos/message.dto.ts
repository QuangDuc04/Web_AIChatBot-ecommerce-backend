import {
  IsString, IsUUID, IsOptional, IsEnum, IsNumber, Min, Max, MinLength, MaxLength, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../types/enums';

export class SendMessageDto {
  @IsUUID(undefined, { message: 'conversationId không hợp lệ' })
  conversationId: string;

  @IsString() @MinLength(1) @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

export class EditMessageDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  message: string;
}

export class MessageFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsDateString()
  before?: string;
}
