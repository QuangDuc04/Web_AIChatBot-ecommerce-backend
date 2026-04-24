import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebsiteToBrand1774454366245 implements MigrationInterface {
    name = 'AddWebsiteToBrand1774454366245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`brands\` ADD \`website\` varchar(500) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`brands\` DROP COLUMN \`website\``);
    }

}
