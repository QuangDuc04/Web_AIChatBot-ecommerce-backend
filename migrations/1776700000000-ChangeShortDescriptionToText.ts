import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeShortDescriptionToText1776700000000 implements MigrationInterface {
    name = 'ChangeShortDescriptionToText1776700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`products\` MODIFY COLUMN \`shortDescription\` text NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`products\` MODIFY COLUMN \`shortDescription\` varchar(500) NULL`
        );
    }
}
