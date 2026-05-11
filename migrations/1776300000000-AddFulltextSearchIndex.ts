import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFulltextSearchIndex1776300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // FULLTEXT indexes require TiFlash replica on TiDB Cloud free tier — skipped.
    // Product search falls back to regular indexed LIKE queries.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
