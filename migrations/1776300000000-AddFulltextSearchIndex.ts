import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFulltextSearchIndex1776300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`products\` ADD FULLTEXT INDEX \`IDX_products_ft_search\` (\`name\`, \`sku\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`products\` DROP INDEX \`IDX_products_ft_search\``);
  }
}
