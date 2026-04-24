import { ProductRepository } from '../repositories/product.repository';
import { ProductImageRepository } from '../repositories/productImage.repository';
import { ProductVariantRepository } from '../repositories/productVariant.repository';
import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductViewRepository } from '../repositories/productView.repository';
import { ReviewRepository } from '../repositories/review.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { CloudinaryService } from './cloudinary.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  ProductFilterDto,
} from '../dtos/product.dto';
import { AppError } from '../errors';
import { generateSlug } from '../utils/slug.util';
import { InventoryTransactionType } from '../types/enums';
import { ChatKnowledgeRepository } from '../repositories/chatKnowledge.repository';

export class ProductService {
  private productRepo = new ProductRepository();
  private imageRepo = new ProductImageRepository();
  private variantRepo = new ProductVariantRepository();
  private inventoryRepo = new InventoryRepository();
  private viewRepo = new ProductViewRepository();
  private reviewRepo = new ReviewRepository();
  private categoryRepo = new CategoryRepository();
  private brandRepo = new BrandRepository();
  private knowledgeRepo = new ChatKnowledgeRepository();

  // ====== Product CRUD ======

  async getAllProducts(filters: ProductFilterDto) {
    return this.productRepo.findAll(filters);
  }

  async getProduct(id: string, userId?: string, ipAddress?: string) {
    const product = await this.productRepo.findByIdOrFail(id);

    // Increment views
    this.productRepo.incrementViews(id).catch(() => {});

    // Log view
    this.viewRepo.create({ productId: id, customerId: userId, ipAddress }).catch(() => {});

    // Get rating stats
    const ratingStats = await this.reviewRepo.getProductRatingStats(id);

    return { ...product, ratingStats };
  }

  async getProductBySlug(slug: string, userId?: string, ipAddress?: string) {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    this.productRepo.incrementViews(product.id).catch(() => {});
    this.viewRepo.create({ productId: product.id, customerId: userId, ipAddress }).catch(() => {});

    const ratingStats = await this.reviewRepo.getProductRatingStats(product.id);
    return { ...product, ratingStats };
  }

  async getFeaturedProducts(limit = 10) {
    return this.productRepo.findFeatured(limit);
  }

  async getBestSellers(limit = 10) {
    return this.productRepo.findBestSellers(limit);
  }

  async getRelatedProducts(productId: string, limit = 10) {
    const product = await this.productRepo.findByIdOrFail(productId);
    return this.productRepo.findRelated(productId, product.categoryId, limit);
  }

  async createProduct(dto: CreateProductDto, imageFiles?: Express.Multer.File[]) {
    const slug = dto.slug || generateSlug(dto.name);

    // Validate references
    await this.categoryRepo.findByIdOrFail(dto.categoryId);
    if (dto.brandId) await this.brandRepo.findByIdOrFail(dto.brandId);

    // Check unique
    const existingSlug = await this.productRepo.findBySlug(slug);
    if (existingSlug) throw new AppError('Slug sản phẩm đã tồn tại', 400);

    const existingSku = await this.productRepo.findBySku(dto.sku);
    if (existingSku) throw new AppError('SKU đã tồn tại', 400);

    // Create product
    const { status: _s, salePrice: _sp, stock: _st, ...restDto } = dto;
    const product = await this.productRepo.create({
      ...restDto,
      slug,
      comparePrice: dto.comparePrice ?? dto.salePrice,
      quantity: dto.quantity ?? dto.stock ?? 0,
      isActive: dto.status !== undefined ? dto.status === 'active' : true,
    });

    // Upload images
    if (imageFiles?.length) {
      const uploaded = await CloudinaryService.uploadMultipleImages(imageFiles, 'products');
      const imageEntities = uploaded.map((img, i) => ({
        productId: product.id,
        url: img.url,
        publicId: img.publicId,
        altText: product.name,
        displayOrder: i,
        isPrimary: i === 0,
      }));
      await this.imageRepo.createMany(imageEntities);
    }

    // Create inventory
    await this.inventoryRepo.create({
      productId: product.id,
      quantity: dto.quantity || 0,
      reservedQuantity: 0,
    });

    return this.productRepo.findByIdOrFail(product.id);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productRepo.findByIdOrFail(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepo.findBySku(dto.sku);
      if (existing) throw new AppError('SKU đã tồn tại', 400);
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productRepo.findBySlug(dto.slug);
      if (existing) throw new AppError('Slug sản phẩm đã tồn tại', 400);
    }

    if (dto.categoryId) await this.categoryRepo.findByIdOrFail(dto.categoryId);
    if (dto.brandId) await this.brandRepo.findByIdOrFail(dto.brandId);

    const { status: _s, salePrice: _sp, stock: _st, ...restDto } = dto;
    const updateData: any = { ...restDto };
    if (dto.salePrice !== undefined) updateData.comparePrice = dto.salePrice;
    if (dto.status !== undefined) updateData.isActive = dto.status === 'active';

    const newQuantity = dto.stock ?? dto.quantity;
    if (newQuantity !== undefined) {
      updateData.quantity = newQuantity;

      // Sync inventory table — source of truth for stock checks
      const inventory = await this.inventoryRepo.findByProductId(id);
      if (inventory) {
        const beforeQuantity = inventory.quantity;
        await this.inventoryRepo.update(inventory.id, { quantity: newQuantity });

        if (beforeQuantity !== newQuantity) {
          await this.inventoryRepo.createTransaction({
            productId: id,
            inventoryId: inventory.id,
            type: newQuantity > beforeQuantity
              ? InventoryTransactionType.IN
              : InventoryTransactionType.ADJUSTMENT,
            quantity: Math.abs(newQuantity - beforeQuantity),
            beforeQuantity,
            afterQuantity: newQuantity,
            reason: 'Cập nhật số lượng từ trang quản lý sản phẩm',
          });
        }
      } else {
        // No inventory record exists — create one
        const created = await this.inventoryRepo.create({
          productId: id,
          quantity: newQuantity,
          reservedQuantity: 0,
        });
        await this.inventoryRepo.createTransaction({
          productId: id,
          inventoryId: created.id,
          type: InventoryTransactionType.IN,
          quantity: newQuantity,
          beforeQuantity: 0,
          afterQuantity: newQuantity,
          reason: 'Tạo bản ghi kho từ cập nhật sản phẩm',
        });
      }
    }

    const updated = await this.productRepo.update(id, updateData);

    // Invalidate chatbot knowledge cache for this product
    this.knowledgeRepo.invalidateByProductIds([id]).catch(() => {});

    return updated;
  }

  async deleteProduct(id: string) {
    await this.productRepo.findByIdOrFail(id);

    if (await this.productRepo.hasOrders(id)) {
      throw new AppError('Không thể xóa sản phẩm đã có đơn hàng', 400);
    }

    // Delete images from Cloudinary
    const images = await this.imageRepo.deleteByProductId(id);
    const publicIds = images.filter((i) => i.publicId).map((i) => i.publicId);
    if (publicIds.length) CloudinaryService.deleteMultipleImages(publicIds).catch(() => {});

    // Delete variants & inventory
    await this.variantRepo.deleteByProductId(id);
    await this.inventoryRepo.deleteByProductId(id);
    await this.productRepo.delete(id);

    // Invalidate chatbot knowledge cache for this product
    this.knowledgeRepo.invalidateByProductIds([id]).catch(() => {});
  }

  // ====== Images ======

  async uploadProductImages(productId: string, files: Express.Multer.File[]) {
    await this.productRepo.findByIdOrFail(productId);

    const uploaded = await CloudinaryService.uploadMultipleImages(files, 'products');
    const existingImages = await this.imageRepo.findByProductId(productId);
    const hasPrimary = existingImages.some((i) => i.isPrimary);

    const imageEntities = uploaded.map((img, i) => ({
      productId,
      url: img.url,
      publicId: img.publicId,
      displayOrder: existingImages.length + i,
      isPrimary: !hasPrimary && i === 0,
    }));

    return this.imageRepo.createMany(imageEntities);
  }

  async deleteProductImage(productId: string, imageId: string) {
    const image = await this.imageRepo.findByIdOrFail(imageId);
    if (image.productId !== productId) throw new AppError('Ảnh không thuộc sản phẩm này', 400);

    if (image.publicId) CloudinaryService.deleteImage(image.publicId).catch(() => {});
    await this.imageRepo.delete(imageId);

    // If primary was deleted, set another as primary
    if (image.isPrimary) {
      const remaining = await this.imageRepo.findByProductId(productId);
      if (remaining.length) {
        await this.imageRepo.update(remaining[0].id, { isPrimary: true });
      }
    }
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const image = await this.imageRepo.findByIdOrFail(imageId);
    if (image.productId !== productId) throw new AppError('Ảnh không thuộc sản phẩm này', 400);
    await this.imageRepo.setPrimary(imageId, productId);
  }

  async reorderImages(productId: string, imageOrders: { id: string; displayOrder: number }[]) {
    for (const item of imageOrders) {
      await this.imageRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return this.imageRepo.findByProductId(productId);
  }

  // ====== Variants ======

  async createVariant(productId: string, dto: CreateProductVariantDto) {
    await this.productRepo.findByIdOrFail(productId);

    const existingSku = await this.variantRepo.findBySku(dto.sku);
    if (existingSku) throw new AppError('SKU biến thể đã tồn tại', 400);

    // Also check product SKU
    const existingProductSku = await this.productRepo.findBySku(dto.sku);
    if (existingProductSku) throw new AppError('SKU đã tồn tại', 400);

    const variant = await this.variantRepo.create({ ...dto, productId });

    await this.inventoryRepo.create({
      productId,
      variantId: variant.id,
      quantity: dto.quantity,
      reservedQuantity: 0,
    });

    return variant;
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantDto) {
    const variant = await this.variantRepo.findByIdOrFail(variantId);

    if (dto.sku && dto.sku !== variant.sku) {
      const existing = await this.variantRepo.findBySku(dto.sku);
      if (existing) throw new AppError('SKU biến thể đã tồn tại', 400);
    }

    // Sync variant inventory when quantity changes
    if (dto.quantity !== undefined) {
      const inventory = await this.inventoryRepo.findByVariantId(variantId);
      if (inventory) {
        const beforeQuantity = inventory.quantity;
        if (beforeQuantity !== dto.quantity) {
          await this.inventoryRepo.update(inventory.id, { quantity: dto.quantity });
          await this.inventoryRepo.createTransaction({
            productId: variant.productId,
            variantId,
            inventoryId: inventory.id,
            type: dto.quantity > beforeQuantity
              ? InventoryTransactionType.IN
              : InventoryTransactionType.ADJUSTMENT,
            quantity: Math.abs(dto.quantity - beforeQuantity),
            beforeQuantity,
            afterQuantity: dto.quantity,
            reason: 'Cập nhật số lượng biến thể từ trang quản lý',
          });
        }
      }
    }

    return this.variantRepo.update(variantId, dto);
  }

  async deleteVariant(variantId: string) {
    await this.variantRepo.findByIdOrFail(variantId);
    await this.variantRepo.delete(variantId);
  }

  // ====== Search ======

  async searchProducts(query: string, filters: ProductFilterDto) {
    return this.productRepo.findAll({ ...filters, search: query });
  }
}
