import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FlashSale } from './FlashSale';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';

@Entity('flash_sale_items')
export class FlashSaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  flashSaleId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId: string;

  /** Phần trăm giảm giá */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  salePrice: number;

  /** Số lượng Flash Sale */
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  soldQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => FlashSale, (flashSale) => flashSale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashSaleId' })
  flashSale: FlashSale;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;
}
