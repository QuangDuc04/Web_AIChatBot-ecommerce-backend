import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendFulltextSearchIndex1776400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old fulltext index (name, sku) and create new one with description
    await queryRunner.query(`ALTER TABLE \`products\` DROP INDEX \`IDX_products_ft_search\``);
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD FULLTEXT INDEX \`IDX_products_ft_search\` (\`name\`, \`description\`, \`sku\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`products\` DROP INDEX \`IDX_products_ft_search\``);
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD FULLTEXT INDEX \`IDX_products_ft_search\` (\`name\`, \`sku\`)`,
    );
  }
}
