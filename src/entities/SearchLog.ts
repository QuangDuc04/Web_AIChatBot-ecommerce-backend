import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from './Customer';
import { Product } from './Product';

@Entity('search_logs')
@Index(['query'])
@Index(['searchedAt'])
export class SearchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  query: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string;

  @Column({ type: 'int', default: 0 })
  resultsCount: number;

  @Column({ type: 'uuid', nullable: true })
  clickedProductId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  searchedAt: Date;

  // Relations
  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clickedProductId' })
  clickedProduct: Product;
}
