import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { Inventory } from '../../entities/Inventory';
import { InventoryTransaction } from '../../entities/InventoryTransaction';
import { InventoryService } from '../../services/inventory.service';
import { ResponseUtil } from '../../utils/response.util';
import { InventoryTransactionType } from '../../types/enums';

const service = new InventoryService();

export class AdminInventoryController {
  /** List all inventory items with product info */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, stockStatus, sortBy = 'p.name', order = 'ASC' } = req.query as any;
      const invRepo = AppDataSource.getRepository(Inventory);

      const qb = invRepo.createQueryBuilder('inv')
        .innerJoinAndSelect('inv.product', 'p')
        .leftJoinAndSelect('inv.variant', 'v')
        .leftJoin('p.images', 'img', 'img.isPrimary = true')
        .addSelect(['img.url']);

      if (search) {
        qb.andWhere('(p.name LIKE :s OR p.sku LIKE :s OR v.name LIKE :s)', { s: `%${search}%` });
      }

      if (stockStatus === 'low') {
        qb.andWhere('inv.quantity > 0 AND inv.quantity <= 10');
      } else if (stockStatus === 'out_of_stock') {
        qb.andWhere('inv.quantity = 0');
      }

      // Only allow sorting by safe columns
      const allowedSorts: Record<string, string> = {
        'name': 'p.name',
        'quantity': 'inv.quantity',
        'reserved': 'inv.reservedQuantity',
        'updatedAt': 'inv.updatedAt',
        'lastRestockedAt': 'inv.lastRestockedAt',
      };
      const sortCol = allowedSorts[sortBy] || 'p.name';
      const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';

      qb.orderBy(sortCol, sortOrder);

      const total = await qb.getCount();
      const p = Number(page);
      const l = Number(limit);
      const items = await qb.skip((p - 1) * l).take(l).getMany();

      const mapped = items.map(inv => ({
        id: inv.id,
        productId: inv.productId,
        variantId: inv.variantId,
        productName: inv.product?.name,
        variantName: inv.variant?.name || null,
        sku: inv.variant?.sku || inv.product?.sku || '',
        image: inv.product?.images?.[0]?.url || null,
        quantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        available: inv.quantity - inv.reservedQuantity,
        lastRestockedAt: inv.lastRestockedAt,
        updatedAt: inv.updatedAt,
      }));

      ResponseUtil.success(res, { items: mapped, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
    } catch (e) { next(e); }
  }

  /** Get stats overview */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const invRepo = AppDataSource.getRepository(Inventory);

      const [totalProducts, totalStock, lowStock, outOfStock] = await Promise.all([
        invRepo.count(),
        invRepo.createQueryBuilder('inv').select('SUM(inv.quantity)', 'total').getRawOne().then(r => Number(r?.total || 0)),
        invRepo.createQueryBuilder('inv').where('inv.quantity > 0 AND inv.quantity <= 10').getCount(),
        invRepo.createQueryBuilder('inv').where('inv.quantity = 0').getCount(),
      ]);

      const totalReserved = await invRepo.createQueryBuilder('inv')
        .select('SUM(inv.reservedQuantity)', 'total').getRawOne().then(r => Number(r?.total || 0));

      ResponseUtil.success(res, { totalProducts, totalStock, totalReserved, lowStock, outOfStock });
    } catch (e) { next(e); }
  }

  /** Get single inventory detail */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const invRepo = AppDataSource.getRepository(Inventory);
      const inv = await invRepo.findOne({
        where: { id: req.params.id },
        relations: ['product', 'product.images', 'variant'],
      });
      if (!inv) return ResponseUtil.error(res, 'Không tìm thấy tồn kho', 404);
      ResponseUtil.success(res, inv);
    } catch (e) { next(e); }
  }

  /** Update stock (set absolute quantity) */
  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity, reason } = req.body;
      const invRepo = AppDataSource.getRepository(Inventory);
      const inv = await invRepo.findOne({ where: { id: req.params.id } });
      if (!inv) return ResponseUtil.error(res, 'Không tìm thấy tồn kho', 404);

      const userId = (req as any).user?.id;
      await service.updateStock(inv.productId, inv.variantId || null, quantity, reason, userId);

      ResponseUtil.success(res, null, 'Cập nhật tồn kho thành công');
    } catch (e) { next(e); }
  }

  /** Restock (add quantity) */
  async restock(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity, reason } = req.body;
      const invRepo = AppDataSource.getRepository(Inventory);
      const inv = await invRepo.findOne({ where: { id: req.params.id } });
      if (!inv) return ResponseUtil.error(res, 'Không tìm thấy tồn kho', 404);

      const userId = (req as any).user?.id;
      await service.restockProduct(inv.productId, inv.variantId || null, quantity, userId);

      ResponseUtil.success(res, null, 'Nhập hàng thành công');
    } catch (e) { next(e); }
  }

  /** Adjust stock (add or subtract delta) */
  async adjust(req: Request, res: Response, next: NextFunction) {
    try {
      const { adjustment, reason } = req.body;
      const invRepo = AppDataSource.getRepository(Inventory);
      const inv = await invRepo.findOne({ where: { id: req.params.id } });
      if (!inv) return ResponseUtil.error(res, 'Không tìm thấy tồn kho', 404);

      const newQty = Math.max(0, inv.quantity + adjustment);
      const userId = (req as any).user?.id;

      const type = adjustment >= 0 ? InventoryTransactionType.IN : InventoryTransactionType.OUT;

      await AppDataSource.getRepository(Inventory).update(inv.id, { quantity: newQty });

      const txRepo = AppDataSource.getRepository(InventoryTransaction);
      await txRepo.save(txRepo.create({
        productId: inv.productId,
        variantId: inv.variantId || undefined,
        inventoryId: inv.id,
        type,
        quantity: Math.abs(adjustment),
        beforeQuantity: inv.quantity,
        afterQuantity: newQty,
        reason,
        createdBy: userId,
      }));

      ResponseUtil.success(res, null, 'Điều chỉnh tồn kho thành công');
    } catch (e) { next(e); }
  }

  /** Get transaction history for an inventory item */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const txRepo = AppDataSource.getRepository(InventoryTransaction);

      const qb = txRepo.createQueryBuilder('tx')
        .leftJoinAndSelect('tx.createdByUser', 'u')
        .where('tx.inventoryId = :id', { id: req.params.id })
        .orderBy('tx.createdAt', 'DESC');

      const total = await qb.getCount();
      const p = Number(page);
      const l = Number(limit);
      const items = await qb.skip((p - 1) * l).take(l).getMany();

      const mapped = items.map(tx => ({
        id: tx.id,
        type: tx.type,
        quantity: tx.quantity,
        beforeQuantity: tx.beforeQuantity,
        afterQuantity: tx.afterQuantity,
        reason: tx.reason,
        reference: tx.reference,
        createdBy: tx.createdByUser?.firstName || null,
        createdAt: tx.createdAt,
      }));

      ResponseUtil.success(res, { items: mapped, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
    } catch (e) { next(e); }
  }

  /** Get all transactions globally (activity log) */
  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, type } = req.query as any;
      const txRepo = AppDataSource.getRepository(InventoryTransaction);

      const qb = txRepo.createQueryBuilder('tx')
        .innerJoinAndSelect('tx.product', 'p')
        .leftJoinAndSelect('tx.variant', 'v')
        .leftJoinAndSelect('tx.createdByUser', 'u')
        .orderBy('tx.createdAt', 'DESC');

      if (type) {
        qb.andWhere('tx.type = :type', { type });
      }

      const total = await qb.getCount();
      const pg = Number(page);
      const l = Number(limit);
      const items = await qb.skip((pg - 1) * l).take(l).getMany();

      const mapped = items.map(tx => ({
        id: tx.id,
        type: tx.type,
        quantity: tx.quantity,
        beforeQuantity: tx.beforeQuantity,
        afterQuantity: tx.afterQuantity,
        reason: tx.reason,
        reference: tx.reference,
        productName: tx.product?.name,
        variantName: tx.variant?.name || null,
        createdBy: tx.createdByUser?.firstName || null,
        createdAt: tx.createdAt,
      }));

      ResponseUtil.success(res, { items: mapped, total, page: pg, limit: l, totalPages: Math.ceil(total / l) });
    } catch (e) { next(e); }
  }
}
