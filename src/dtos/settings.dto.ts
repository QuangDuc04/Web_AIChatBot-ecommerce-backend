import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  key: string;

  value: unknown;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsString()
  description?: string;
}
