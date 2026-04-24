import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MessageType } from '../types/enums';
import { Conversation } from './Conversation';
import { Customer } from './Customer';
import { User } from './User';
import { MessageReadReceipt } from './MessageReadReceipt';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'uuid', nullable: true })
  senderCustomerId: string;

  @Column({ type: 'uuid', nullable: true })
  senderUserId: string;

  @Column({ type: 'text' })
  message: string;

  /** File dinh kem [{url, name, type, size}] */
  @Column({ type: 'json', nullable: true })
  attachments: Array<{ url: string; name: string; type: string; size: number }>;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderCustomerId' })
  senderCustomer: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderUserId' })
  senderUser: User;

  @OneToMany(() => MessageReadReceipt, (receipt) => receipt.message, { cascade: true })
  readReceipts: MessageReadReceipt[];

  get sender(): Customer | User | null {
    return this.senderCustomer || this.senderUser || null;
  }
}
