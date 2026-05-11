import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewsTable1774500000000 implements MigrationInterface {
    name = 'CreateNewsTable1774500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`news\` (
                \`id\` VARCHAR(36) NOT NULL,
                \`title\` varchar(500) NOT NULL,
                \`slug\` varchar(500) NOT NULL,
                \`summary\` text NULL,
                \`content\` longtext NULL,
                \`thumbnail\` varchar(500) NULL,
                \`author\` varchar(100) NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`displayOrder\` int NOT NULL DEFAULT 0,
                \`publishedAt\` timestamp NULL,
                \`tags\` json NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_news_slug\` (\`slug\`),
                INDEX \`IDX_news_createdAt\` (\`createdAt\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`news\``);
    }

}
