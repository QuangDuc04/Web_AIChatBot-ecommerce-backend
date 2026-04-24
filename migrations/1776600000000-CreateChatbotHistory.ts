import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatbotHistory1776600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`chatbot_sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`clientId\` varchar(36) NOT NULL,
        \`customerId\` varchar(36) NULL,
        \`metadata\` json NULL,
        \`messageCount\` int NOT NULL DEFAULT 0,
        \`lastMessageAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_cs_clientId\` (\`clientId\`),
        INDEX \`IDX_cs_customerId\` (\`customerId\`),
        CONSTRAINT \`FK_cs_customer\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`chatbot_messages\` (
        \`id\` varchar(36) NOT NULL,
        \`sessionId\` varchar(36) NOT NULL,
        \`role\` enum('user','assistant') NOT NULL,
        \`content\` text NOT NULL,
        \`toolCalls\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_cm_sessionId\` (\`sessionId\`),
        INDEX \`IDX_cm_createdAt\` (\`createdAt\`),
        CONSTRAINT \`FK_cm_session\` FOREIGN KEY (\`sessionId\`) REFERENCES \`chatbot_sessions\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`chatbot_messages\``);
    await queryRunner.query(`DROP TABLE \`chatbot_sessions\``);
  }
}
