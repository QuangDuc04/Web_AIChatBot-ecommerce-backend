import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { UnitType } from '../types/enums';

@Entity('order_items')
@Index(['orderId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId: string;

  /** Snapshot tên sản phẩm tại thời điểm đặt hàng */
  @Column({ type: 'varchar', length: 500 })
  productName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variantName: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  /** Snapshot ảnh sản phẩm */
  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  /** Snapshot đơn vị bán tại thời điểm đặt hàng */
  @Column({ type: 'enum', enum: UnitType, nullable: true, default: null })
  unitType: UnitType | null;

  @Column({ type: 'int' })
  quantity: number;

  /** Snapshot giá tại thời điểm đặt hàng */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  /** quantity * price */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariant, (variant) => variant.orderItems, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;
}
