import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleOAuth1774800000000 implements MigrationInterface {
    name = 'AddGoogleOAuth1774800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`googleId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_users_googleId\` (\`googleId\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`authProvider\` enum('local', 'google') NOT NULL DEFAULT 'local'`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`password\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`password\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`authProvider\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_users_googleId\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`googleId\``);
    }
}
