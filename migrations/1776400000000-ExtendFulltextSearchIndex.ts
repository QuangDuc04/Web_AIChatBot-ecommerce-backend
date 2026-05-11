import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendFulltextSearchIndex1776400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // FULLTEXT indexes not supported on TiDB Cloud free tier — skipped.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
