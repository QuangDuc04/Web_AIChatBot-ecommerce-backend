import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OrderConfirmationStatus, PaymentMethod } from '../types/enums';

@Entity('order_confirmations')
@Index(['token'], { unique: true })
@Index(['status'])
export class OrderConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string | null;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail: string | null;

  @Column({ type: 'json' })
  shippingAddress: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };

  @Column({ type: 'json' })
  items: {
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    price: number;
    quantity: number;
    image?: string;
  }[];

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: OrderConfirmationStatus,
    default: OrderConfirmationStatus.PENDING,
  })
  status: OrderConfirmationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
