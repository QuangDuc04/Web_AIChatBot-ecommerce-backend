import { FlashSaleRepository } from '../repositories/flashSale.repository';
import { FlashSaleItemRepository } from '../repositories/flashSaleItem.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CreateFlashSaleDto, UpdateFlashSaleDto, CreateFlashSaleItemDto, UpdateFlashSaleItemDto } from '../dtos/flashSale.dto';
import { CacheUtil } from '../utils/cache.util';
import { AppError } from '../errors';

const CACHE_KEY = 'flashsales:active';

export class FlashSaleService {
  private saleRepo = new FlashSaleRepository();
  private itemRepo = new FlashSaleItemRepository();
  private productRepo = new ProductRepository();

  // Customer
  async getActiveFlashSales() {
    const cached = await CacheUtil.get(CACHE_KEY);
    if (cached) return cached;

    const sales = await this.saleRepo.findActive();
    const result = sales.map(s => ({
      ...s,
      remainingSeconds: Math.max(0, Math.floor((new Date(s.endDate).getTime() - Date.now()) / 1000)),
    }));

    await CacheUtil.set(CACHE_KEY, result, 300);
    return result;
  }

  async getFlashSale(id: string) {
    const sale = await this.saleRepo.findByIdOrFail(id);
    return {
      ...sale,
      remainingSeconds: Math.max(0, Math.floor((new Date(sale.endDate).getTime() - Date.now()) / 1000)),
      items: sale.items?.map(i => ({
        ...i,
        available: i.quantity - i.soldQuantity,
      })),
    };
  }

  async checkProductInFlashSale(productId: string) {
    return this.itemRepo.findActiveByProductId(productId);
  }

  // Admin
  async getAllFlashSales(filters?: { isActive?: boolean; page?: number; limit?: number }) {
    return this.saleRepo.findAll(filters);
  }

  async createFlashSale(dto: CreateFlashSaleDto) {
    const startDate = dto.startDate || dto.startTime;
    const endDate = dto.endDate || dto.endTime;
    if (!startDate || !endDate) throw new AppError('Cần có ngày bắt đầu và ngày kết thúc', 400);
    if (new Date(endDate) <= new Date(startDate)) {
      throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
    }
    let isActive = dto.isActive !== undefined ? dto.isActive : true;
    if (dto.status !== undefined) isActive = dto.status === 'active';
    const sale = await this.saleRepo.create({
      name: dto.name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
    } as any);
    await CacheUtil.del(CACHE_KEY);
    return sale;
  }

  async updateFlashSale(id: string, dto: UpdateFlashSaleDto) {
    await this.saleRepo.findByIdOrFail(id);
    const { status: _s, startTime: _st, endTime: _et, description: _d, discountPercentage: _dp, ...rest } = dto as any;
    const data: any = { ...rest };
    const startDate = dto.startDate || dto.startTime;
    const endDate = dto.endDate || dto.endTime;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    const result = await this.saleRepo.update(id, data);
    await CacheUtil.del(CACHE_KEY);
    return result;
  }

  async deleteFlashSale(id: string) {
    await this.saleRepo.findByIdOrFail(id);
    await this.itemRepo.deleteByFlashSaleId(id);
    await this.saleRepo.delete(id);
    await CacheUtil.del(CACHE_KEY);
  }

  async addFlashSaleItem(flashSaleId: string, dto: CreateFlashSaleItemDto) {
    const sale = await this.saleRepo.findByIdOrFail(flashSaleId);
    const product = await this.productRepo.findByIdOrFail(dto.productId);

    const originalPrice = Number(product.price);
    const salePrice = originalPrice - (originalPrice * dto.discountPercent / 100);

    const item = await this.itemRepo.create({
      flashSaleId,
      productId: dto.productId,
      variantId: dto.variantId,
      discountPercent: dto.discountPercent,
      originalPrice,
      salePrice: Math.round(salePrice),
      quantity: dto.quantity,
      soldQuantity: 0,
    });
    await CacheUtil.del(CACHE_KEY);
    return item;
  }

  async updateFlashSaleItem(itemId: string, dto: UpdateFlashSaleItemDto) {
    const item = await this.itemRepo.findByIdOrFail(itemId);
    const data: any = { ...dto };
    if (dto.discountPercent) {
      data.salePrice = Math.round(Number(item.originalPrice) - (Number(item.originalPrice) * dto.discountPercent / 100));
    }
    const result = await this.itemRepo.update(itemId, data);
    await CacheUtil.del(CACHE_KEY);
    return result;
  }

  async removeFlashSaleItem(itemId: string) {
    await this.itemRepo.findByIdOrFail(itemId);
    await this.itemRepo.delete(itemId);
    await CacheUtil.del(CACHE_KEY);
  }
}
