import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBuyingUnitTypeToCartItem1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`cart_items\` ADD \`buyingUnitType\` enum('cuon', 'thung', 'cai') NULL DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cart_items\` DROP COLUMN \`buyingUnitType\``);
  }
}
