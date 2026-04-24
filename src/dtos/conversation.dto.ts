import {
  IsString, IsUUID, IsOptional, IsEnum, IsNumber, Min, Max, MinLength, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationType, ConversationStatus } from '../types/enums';

export class CreateConversationDto {
  @IsEnum(ConversationType, {
    message: `Loại cuộc hội thoại không hợp lệ. Giá trị hợp lệ: ${Object.values(ConversationType).join(', ')}`,
  })
  type: ConversationType;

  @IsOptional()
  @IsUUID(undefined, { message: 'orderId không hợp lệ' })
  orderId?: string;

  @IsString() @MinLength(1) @MaxLength(1000)
  initialMessage: string;
}

export class AssignConversationDto {
  @IsUUID(undefined, { message: 'staffId không hợp lệ' })
  staffId: string;
}

export class ConversationFilterDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional() @IsEnum(ConversationType)
  type?: ConversationType;
}
