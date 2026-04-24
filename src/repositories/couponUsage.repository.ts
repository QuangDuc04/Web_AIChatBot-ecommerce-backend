import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CouponUsage } from '../entities/CouponUsage';

export class CouponUsageRepository {
  private repo: Repository<CouponUsage>;

  constructor() {
    this.repo = AppDataSource.getRepository(CouponUsage);
  }

  async countByCustomerAndCoupon(customerId: string, couponId: string): Promise<number> {
    return this.repo.count({ where: { customerId, couponId } });
  }

  async countByEmailAndCoupon(email: string, couponId: string): Promise<number> {
    return this.repo.count({ where: { customerEmail: email, couponId } });
  }

  async create(data: Partial<CouponUsage>): Promise<CouponUsage> {
    const usage = this.repo.create(data);
    return this.repo.save(usage);
  }

  async findByCouponId(couponId: string): Promise<CouponUsage[]> {
    return this.repo.find({
      where: { couponId },
      relations: ['customer', 'order'],
      order: { usedAt: 'DESC' },
    });
  }
}
