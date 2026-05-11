import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatKnowledge1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`chat_knowledge\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`question\` varchar(500) NOT NULL,
        \`answer\` text NOT NULL,
        \`questionType\` enum('product_inquiry','pricing','policy','general') NOT NULL DEFAULT 'general',
        \`toolName\` varchar(100) NULL,
        \`toolArgs\` json NULL,
        \`productIds\` json NULL,
        \`hitCount\` int NOT NULL DEFAULT 0,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`expiresAt\` datetime NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ck_active_expires\` (\`isActive\`, \`expiresAt\`),
        INDEX \`IDX_ck_question_type\` (\`questionType\`),
        FULLTEXT INDEX \`IDX_ck_question_ft\` (\`question\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`chat_knowledge\``);
  }
}
