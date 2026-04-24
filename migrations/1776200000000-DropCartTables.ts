import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCartTables1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`cart_items\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`carts\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`carts\` (
        \`id\` varchar(36) NOT NULL,
        \`customerId\` varchar(36) NULL,
        \`sessionId\` varchar(255) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_carts_customerId\` (\`customerId\`),
        UNIQUE INDEX \`IDX_carts_sessionId\` (\`sessionId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`cart_items\` (
        \`id\` varchar(36) NOT NULL,
        \`cartId\` varchar(36) NOT NULL,
        \`productId\` varchar(36) NOT NULL,
        \`variantId\` varchar(36) NULL,
        \`quantity\` int NOT NULL,
        \`price\` decimal(15,2) NOT NULL,
        \`buyingUnitType\` enum('cuon','thung','cai') NULL DEFAULT NULL,
        \`addedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_cart_items_cartId\` (\`cartId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_cart_items_cart\` FOREIGN KEY (\`cartId\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }
}
