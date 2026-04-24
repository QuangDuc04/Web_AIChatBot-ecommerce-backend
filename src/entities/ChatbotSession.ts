import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { ChatbotMessage } from './ChatbotMessage';

@Entity('chatbot_sessions')
@Index(['clientId'])
export class ChatbotSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** cart_session_id from frontend localStorage */
  @Column({ type: 'varchar', length: 36 })
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatbotMessage, (msg) => msg.session)
  messages: ChatbotMessage[];
}
