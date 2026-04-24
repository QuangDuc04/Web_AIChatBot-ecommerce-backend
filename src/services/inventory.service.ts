import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductRepository } from '../repositories/product.repository';
import { AppError } from '../errors';
import { InventoryTransactionType } from '../types/enums';

export class InventoryService {
  private inventoryRepo = new InventoryRepository();
  private productRepo = new ProductRepository();

  async getInventory(productId: string, variantId?: string) {
    const inv = variantId
      ? await this.inventoryRepo.findByVariantId(variantId)
      : await this.inventoryRepo.findByProductId(productId);

    if (!inv) throw new AppError('Không tìm thấy thông tin tồn kho', 404);

    return {
      ...inv,
      available: inv.quantity - inv.reservedQuantity,
    };
  }

  async updateStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    reason: string,
    userId?: string,
  ) {
    const inv = variantId
      ? await this.inventoryRepo.findByVariantId(variantId)
      : await this.inventoryRepo.findByProductId(productId);

    if (!inv) throw new AppError('Không tìm thấy thông tin tồn kho', 404);

    const beforeQty = inv.quantity;
    const afterQty = quantity;
    const diff = afterQty - beforeQty;
    const type = diff >= 0 ? InventoryTransactionType.IN : InventoryTransactionType.OUT;

    await this.inventoryRepo.update(inv.id, { quantity: afterQty });

    await this.inventoryRepo.createTransaction({
      productId,
      variantId: variantId || undefined,
      inventoryId: inv.id,
      type,
      quantity: Math.abs(diff),
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      reason,
      createdBy: userId,
    });
  }

  async reserveStock(productId: string, variantId: string | null, quantity: number) {
    const available = await this.inventoryRepo.checkAvailability(productId, variantId, quantity);
    if (!available) throw new AppError('Sản phẩm không đủ số lượng trong kho', 400);
    await this.inventoryRepo.reserveStock(productId, variantId, quantity);
  }

  async releaseStock(productId: string, variantId: string | null, quantity: number) {
    await this.inventoryRepo.releaseStock(productId, variantId, quantity);
  }

  async confirmSale(productId: string, variantId: string | null, quantity: number, reference?: string) {
    const inv = variantId
      ? await this.inventoryRepo.findByVariantId(variantId)
      : await this.inventoryRepo.findByProductId(productId);

    if (!inv) return;

    const beforeQty = inv.quantity;
    const afterQty = Math.max(0, beforeQty - quantity);

    await this.inventoryRepo.update(inv.id, {
      quantity: afterQty,
      reservedQuantity: Math.max(0, inv.reservedQuantity - quantity),
    });

    await this.inventoryRepo.createTransaction({
      productId,
      variantId: variantId || undefined,
      inventoryId: inv.id,
      type: InventoryTransactionType.OUT,
      quantity,
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      reason: 'Bán hàng',
      reference,
    });

    await this.productRepo.incrementSoldCount(productId, quantity);
  }

  async restockProduct(
    productId: string,
    variantId: string | null,
    quantity: number,
    userId?: string,
  ) {
    const inv = variantId
      ? await this.inventoryRepo.findByVariantId(variantId)
      : await this.inventoryRepo.findByProductId(productId);

    if (!inv) throw new AppError('Không tìm thấy thông tin tồn kho', 404);

    const beforeQty = inv.quantity;
    const afterQty = beforeQty + quantity;

    await this.inventoryRepo.update(inv.id, {
      quantity: afterQty,
      lastRestockedAt: new Date(),
    });

    await this.inventoryRepo.createTransaction({
      productId,
      variantId: variantId || undefined,
      inventoryId: inv.id,
      type: InventoryTransactionType.IN,
      quantity,
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      reason: 'Nhập hàng',
      createdBy: userId,
    });
  }

  async getLowStockProducts(threshold = 10) {
    return this.inventoryRepo.getLowStockProducts(threshold);
  }
}
