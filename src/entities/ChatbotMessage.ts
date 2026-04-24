import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ChatbotSession } from './ChatbotSession';

export enum ChatbotMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chatbot_messages')
@Index(['createdAt'])
export class ChatbotMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ChatbotSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatbotSession;

  @Column({ type: 'enum', enum: ChatbotMessageRole })
  role: ChatbotMessageRole;

  @Column({ type: 'text' })
  content: string;

  /** Tools used by AI in this response (for analytics) */
  @Column({ type: 'json', nullable: true })
  toolCalls: Record<string, unknown>[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
