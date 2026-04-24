import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaiUnitTypeAndNullable1775900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Expand enum to include 'cai' and allow NULL on products
    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY \`unitType\` enum('cuon', 'thung', 'cai') NULL DEFAULT NULL`,
    );

    // Same for order_items snapshot column
    await queryRunner.query(
      `ALTER TABLE \`order_items\` MODIFY \`unitType\` enum('cuon', 'thung', 'cai') NULL DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: set NULLs back to 'cuon', then restore original enum
    await queryRunner.query(
      `UPDATE \`products\` SET \`unitType\` = 'cuon' WHERE \`unitType\` IS NULL OR \`unitType\` = 'cai'`,
    );
    await queryRunner.query(
      `UPDATE \`order_items\` SET \`unitType\` = 'cuon' WHERE \`unitType\` IS NULL OR \`unitType\` = 'cai'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY \`unitType\` enum('cuon', 'thung') NOT NULL DEFAULT 'cuon'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` MODIFY \`unitType\` enum('cuon', 'thung') NOT NULL DEFAULT 'cuon'`,
    );
  }
}
