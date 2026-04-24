import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnitTypeToProduct1775100000000 implements MigrationInterface {
    name = 'AddUnitTypeToProduct1775100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`products\` ADD \`unitType\` enum('cuon', 'thung') NOT NULL DEFAULT 'cuon'`
        );
        await queryRunner.query(
            `ALTER TABLE \`order_items\` ADD \`unitType\` enum('cuon', 'thung') NOT NULL DEFAULT 'cuon'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP COLUMN \`unitType\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`unitType\``);
    }
}
