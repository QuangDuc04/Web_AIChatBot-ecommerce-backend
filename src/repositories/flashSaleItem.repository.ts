import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { FlashSaleItem } from '../entities/FlashSaleItem';
import { NotFoundError } from '../errors';

export class FlashSaleItemRepository {
  private repo: Repository<FlashSaleItem>;

  constructor() {
    this.repo = AppDataSource.getRepository(FlashSaleItem);
  }

  async findByFlashSaleId(flashSaleId: string): Promise<FlashSaleItem[]> {
    return this.repo.find({ where: { flashSaleId }, relations: ['product', 'product.images', 'variant'] });
  }

  async findByIdOrFail(id: string): Promise<FlashSaleItem> {
    const i = await this.repo.findOne({ where: { id }, relations: ['product', 'variant'] });
    if (!i) throw new NotFoundError('Không tìm thấy sản phẩm Flash Sale');
    return i;
  }

  async findActiveByProductId(productId: string): Promise<FlashSaleItem | null> {
    const now = new Date();
    return this.repo.createQueryBuilder('fsi')
      .leftJoinAndSelect('fsi.flashSale', 'fs')
      .where('fsi.productId = :productId', { productId })
      .andWhere('fs.isActive = true')
      .andWhere('fs.startDate <= :now', { now })
      .andWhere('fs.endDate >= :now', { now })
      .getOne();
  }

  async create(data: Partial<FlashSaleItem>): Promise<FlashSaleItem> {
    const i = this.repo.create(data);
    return this.repo.save(i);
  }

  async update(id: string, data: Partial<FlashSaleItem>): Promise<FlashSaleItem> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async incrementSoldQuantity(id: string, quantity: number): Promise<void> {
    await this.repo.increment({ id }, 'soldQuantity', quantity);
  }

  async deleteByFlashSaleId(flashSaleId: string): Promise<void> {
    await this.repo.delete({ flashSaleId });
  }
}
