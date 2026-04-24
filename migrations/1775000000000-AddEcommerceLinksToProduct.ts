import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEcommerceLinksToProduct1775000000000 implements MigrationInterface {
    name = 'AddEcommerceLinksToProduct1775000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` ADD \`shopeeLink\` varchar(1000) NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD \`tiktokLink\` varchar(1000) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`tiktokLink\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`shopeeLink\``);
    }

}
