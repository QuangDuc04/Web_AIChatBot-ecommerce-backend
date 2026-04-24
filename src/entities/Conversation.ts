import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ConversationType, ConversationStatus } from '../types/enums';
import { Order } from './Order';
import { ConversationParticipant } from './ConversationParticipant';
import { Message } from './Message';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  // Guest chat fields (no auth required)
  @Column({ type: 'varchar', length: 255, nullable: true })
  guestName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guestPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestEmail: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  guestIpAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guestDevice: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToMany(() => ConversationParticipant, (participant) => participant.conversation, { cascade: true })
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages: Message[];
}
