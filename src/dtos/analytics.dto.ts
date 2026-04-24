import { IsDateString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsFilterDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional() @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string;
}

export class ProductAnalyticsDto {
  @IsOptional() @IsEnum(['7days', '30days', '90days', 'year'])
  period?: string;

  @IsOptional() @IsNumber() @Min(1) @Max(100) @Type(() => Number)
  limit?: number;
}
