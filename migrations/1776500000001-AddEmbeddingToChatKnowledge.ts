import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmbeddingToChatKnowledge1776500000001 implements MigrationInterface {
  name = 'AddEmbeddingToChatKnowledge1776500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chat_knowledge\` ADD \`embedding\` json NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chat_knowledge\` DROP COLUMN \`embedding\``
    );
  }
}
