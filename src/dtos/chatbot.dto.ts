import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ChatbotMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Tin nhắn không được để trống' })
  @MaxLength(1000, { message: 'Tin nhắn tối đa 1000 ký tự' })
  message!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}
