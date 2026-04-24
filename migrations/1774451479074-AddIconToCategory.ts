import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIconToCategory1774451479074 implements MigrationInterface {
    name = 'AddIconToCategory1774451479074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` ADD \`icon\` varchar(500) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`icon\``);
    }

}
