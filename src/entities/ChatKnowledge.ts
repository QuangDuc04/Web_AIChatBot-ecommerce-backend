import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ChatQuestionType {
  PRODUCT_INQUIRY = 'product_inquiry',
  PRICING = 'pricing',
  POLICY = 'policy',
  GENERAL = 'general',
}

@Entity('chat_knowledge')
@Index(['isActive', 'expiresAt'])
@Index(['questionType'])
export class ChatKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'enum', enum: ChatQuestionType, default: ChatQuestionType.GENERAL })
  questionType: ChatQuestionType;

  /** Tool name the AI used to answer (e.g. search_products) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  toolName: string;

  /** Tool args for debugging / analysis */
  @Column({ type: 'json', nullable: true })
  toolArgs: Record<string, unknown>;

  /** Product IDs related to this answer — used for auto-invalidation */
  @Column({ type: 'json', nullable: true })
  productIds: string[];

  /** Embedding vector for semantic similarity search (float array from the configured Gemini embedding model — dim depends on model, e.g. 3072 for gemini-embedding-001, 768 for text-embedding-004) */
  @Column({ type: 'json', nullable: true })
  embedding: number[];

  @Column({ type: 'int', default: 0 })
  hitCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
