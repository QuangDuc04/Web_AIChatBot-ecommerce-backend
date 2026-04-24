import { IsString, IsUUID, IsNumber, IsOptional, IsEnum, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductsDto {
  @IsString() @MinLength(1) @MaxLength(200)
  query: string;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number)
  limit?: number;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsOptional() @IsUUID()
  brandId?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  minPrice?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  maxPrice?: number;

  @IsOptional() @IsEnum(['relevance', 'price_asc', 'price_desc', 'newest'])
  sort?: string;
}

export class SearchSuggestionsDto {
  @IsString() @MinLength(1) @MaxLength(100)
  query: string;

  @IsOptional() @IsNumber() @Min(1) @Max(10) @Type(() => Number)
  limit?: number;
}
