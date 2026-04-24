import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { Like } from 'typeorm';

export class OrderNumberUtil {
  static async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    const repo = AppDataSource.getRepository(Order);
    const lastOrder = await repo.findOne({
      where: { orderNumber: Like(`${prefix}%`) },
      order: { orderNumber: 'DESC' },
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(5, '0')}`;
  }
}
