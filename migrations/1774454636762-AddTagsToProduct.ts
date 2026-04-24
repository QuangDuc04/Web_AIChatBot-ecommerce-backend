import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsToProduct1774454636762 implements MigrationInterface {
    name = 'AddTagsToProduct1774454636762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` ADD \`tags\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`tags\``);
    }

}
