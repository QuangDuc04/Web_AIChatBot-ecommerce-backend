import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { InventoryTransaction } from './InventoryTransaction';

@Entity('inventories')
@Index(['productId', 'variantId'], { unique: true })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  /** Số lượng đã đặt trước (đang trong đơn hàng chưa hoàn thành) */
  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRestockedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.inventory)
  transactions: InventoryTransaction[];
}
