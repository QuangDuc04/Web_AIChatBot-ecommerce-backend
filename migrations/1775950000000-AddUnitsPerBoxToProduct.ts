import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitsPerBoxToProduct1775950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD \`unitsPerBox\` int NULL DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD \`boxSubUnit\` enum('cuon', 'thung', 'cai') NULL DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD \`boxPrice\` decimal(15,2) NULL DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`boxPrice\``);
    await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`boxSubUnit\``);
    await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`unitsPerBox\``);
  }
}
