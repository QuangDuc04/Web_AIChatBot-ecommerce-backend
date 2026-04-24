import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  IsIn,
  Min,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UnitType } from '../types/enums';

export class CreateProductDto {
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @MinLength(2, { message: 'Tên sản phẩm phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Tên sản phẩm không được quá 200 ký tự' })
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsUUID(undefined, { message: 'categoryId không hợp lệ' })
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsUUID(undefined, { message: 'brandId không hợp lệ' })
  brandId?: string;

  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsEnum(UnitType, { message: 'Đơn vị bán phải là cuon, thung hoặc cai' })
  unitType?: UnitType | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  unitsPerBox?: number | null;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsEnum(UnitType, { message: 'Đơn vị con phải là cuon hoặc cai' })
  boxSubUnit?: UnitType | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  boxPrice?: number | null;

  @IsString({ message: 'SKU không được để trống' })
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsObject()
  dimensions?: { length: number; width: number; height: number };

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @Matches(/^https?:\/\/([\w-]+\.)?shopee\.(vn|co\.id|com\.my|sg|ph|co\.th|com\.br|com|tw)\/.+$/i, {
    message: 'Link Shopee không hợp lệ. VD: https://shopee.vn/product/...',
  })
  shopeeLink?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @Matches(/^https?:\/\/([\w-]+\.)?(tiktok\.com|vt\.tiktok\.com)\/.+$/i, {
    message: 'Link TikTok không hợp lệ. VD: https://www.tiktok.com/@shop/product/...',
  })
  tiktokLink?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsEnum(UnitType, { message: 'Đơn vị bán phải là cuon, thung hoặc cai' })
  unitType?: UnitType | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  unitsPerBox?: number | null;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsEnum(UnitType, { message: 'Đơn vị con phải là cuon hoặc cai' })
  boxSubUnit?: UnitType | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  boxPrice?: number | null;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsObject()
  dimensions?: { length: number; width: number; height: number };

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @Matches(/^https?:\/\/([\w-]+\.)?shopee\.(vn|co\.id|com\.my|sg|ph|co\.th|com\.br|com|tw)\/.+$/i, {
    message: 'Link Shopee không hợp lệ. VD: https://shopee.vn/product/...',
  })
  shopeeLink?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @Matches(/^https?:\/\/([\w-]+\.)?(tiktok\.com|vt\.tiktok\.com)\/.+$/i, {
    message: 'Link TikTok không hợp lệ. VD: https://www.tiktok.com/@shop/product/...',
  })
  tiktokLink?: string;
}

export class CreateProductVariantDto {
  @IsString({ message: 'Tên biến thể không được để trống' })
  name: string;

  @IsString({ message: 'SKU không được để trống' })
  sku: string;

  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsObject({ message: 'Thuộc tính phải là object' })
  attributes: Record<string, string>;
}

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export enum ProductSortEnum {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  POPULAR = 'popular',
  BEST_SELLER = 'best_seller',
  CATEGORY_ORDER = 'category_order',
}

export class ProductFilterDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: string;

  @IsOptional()
  @IsEnum(ProductSortEnum, { message: 'Sắp xếp không hợp lệ' })
  sort?: ProductSortEnum;

  /** Internal: 'relaxed' = OR-based FULLTEXT; 'like' = LIKE-based (handles short words FULLTEXT drops) */
  searchMode?: 'strict' | 'relaxed' | 'like';

  /** Internal: skip heavy columns (description, images) — for chatbot / autocomplete */
  lightweight?: boolean;
}
