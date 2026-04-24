import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/enums';
import { Customer } from './Customer';
import { Address } from './Address';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';
import { Shipment } from './Shipment';
import { OrderStatusHistory } from './OrderStatusHistory';
import { ProductReview } from './ProductReview';

@Entity('orders')
@Index(['customerId'])
@Index(['status'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'boolean', default: false })
  isGuest: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guestPhone: string;

  @Column({ type: 'json', nullable: true })
  guestAddress: { street: string; city: string; district: string; ward: string } | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Tổng tiền hàng */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  /** Phí vận chuyển */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  tax: number;

  /** Giảm giá từ coupon/khuyến mãi */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discount: number;

  /** Tổng thanh toán */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  shippingAddressId: string;

  @Column({ type: 'uuid', nullable: true })
  billingAddressId: string;

  @Column({ type: 'text', nullable: true })
  customerNote: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancelReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress: Address;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billingAddressId' })
  billingAddress: Address;

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @OneToOne(() => Shipment, (shipment) => shipment.order)
  shipment: Shipment;

  @OneToMany(() => OrderStatusHistory, (history) => history.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  @OneToMany(() => ProductReview, (review) => review.order)
  reviews: ProductReview[];
}
