import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CouponType } from '../types/enums';
import { CouponUsage } from './CouponUsage';

@Entity('coupons')
@Index(['isActive'])
@Index(['startDate', 'endDate'])
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  /** Giá trị giảm (% hoặc VND) */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  value: number;

  /** Giá trị đơn hàng tối thiểu */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  minOrderValue: number;

  /** Giảm tối đa (cho loại %) */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxDiscount: number;

  /** Tổng số lần sử dụng tối đa */
  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  /** Số lần sử dụng tối đa mỗi user */
  @Column({ type: 'int', default: 1 })
  userUsageLimit: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Danh sách product IDs áp dụng (null = tất cả) */
  @Column({ type: 'json', nullable: true })
  applicableProducts: string[];

  /** Danh sách category IDs áp dụng (null = tất cả) */
  @Column({ type: 'json', nullable: true })
  applicableCategories: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages: CouponUsage[];
}
