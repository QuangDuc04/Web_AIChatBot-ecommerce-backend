import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shipping_methods')
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Phí cơ bản */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseCost: number;

  /** Phí theo km (nullable) */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  costPerKm: number;

  /** Số ngày giao hàng ước tính */
  @Column({ type: 'int' })
  estimatedDays: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Danh sách tỉnh/thành áp dụng */
  @Column({ type: 'json', nullable: true })
  provinces: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
