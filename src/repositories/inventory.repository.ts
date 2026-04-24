import { LessThan, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Inventory } from '../entities/Inventory';
import { InventoryTransaction } from '../entities/InventoryTransaction';
import { InventoryTransactionType } from '../types/enums';

export class InventoryRepository {
  private repo: Repository<Inventory>;
  private txRepo: Repository<InventoryTransaction>;

  constructor() {
    this.repo = AppDataSource.getRepository(Inventory);
    this.txRepo = AppDataSource.getRepository(InventoryTransaction);
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.repo.findOne({ where: { productId } });
  }

  async findByVariantId(variantId: string): Promise<Inventory | null> {
    return this.repo.findOne({ where: { variantId } });
  }

  async create(data: Partial<Inventory>): Promise<Inventory> {
    const inv = this.repo.create(data);
    return this.repo.save(inv);
  }

  async update(id: string, data: Partial<Inventory>): Promise<void> {
    await this.repo.update(id, data as any);
  }

  async checkAvailability(productId: string, variantId: string | null, quantity: number): Promise<boolean> {
    const inv = variantId
      ? await this.findByVariantId(variantId)
      : await this.findByProductId(productId);
    if (!inv) return false;
    return (inv.quantity - inv.reservedQuantity) >= quantity;
  }

  async reserveStock(productId: string, variantId: string | null, quantity: number): Promise<void> {
    const inv = variantId
      ? await this.findByVariantId(variantId)
      : await this.findByProductId(productId);
    if (!inv) return;
    await this.repo.increment({ id: inv.id }, 'reservedQuantity', quantity);
  }

  async releaseStock(productId: string, variantId: string | null, quantity: number): Promise<void> {
    const inv = variantId
      ? await this.findByVariantId(variantId)
      : await this.findByProductId(productId);
    if (!inv) return;
    await this.repo.decrement({ id: inv.id }, 'reservedQuantity', quantity);
  }

  async createTransaction(data: {
    productId: string;
    variantId?: string;
    inventoryId: string;
    type: InventoryTransactionType;
    quantity: number;
    beforeQuantity: number;
    afterQuantity: number;
    reason?: string;
    reference?: string;
    createdBy?: string;
  }): Promise<InventoryTransaction> {
    const tx = this.txRepo.create(data);
    return this.txRepo.save(tx);
  }

  async getLowStockProducts(threshold = 10): Promise<Inventory[]> {
    return this.repo.find({
      where: { quantity: LessThan(threshold) },
      relations: ['product'],
    });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.txRepo.delete({ productId });
    await this.repo.delete({ productId });
  }
}
