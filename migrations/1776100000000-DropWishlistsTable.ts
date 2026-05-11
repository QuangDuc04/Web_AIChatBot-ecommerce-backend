import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropWishlistsTable1776100000000 implements MigrationInterface {
  name = 'DropWishlistsTable1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS wishlists`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        customerId VARCHAR(36) NOT NULL,
        productId VARCHAR(36) NOT NULL,
        variantId VARCHAR(36) NULL,
        createdAt TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE KEY UQ_wishlists_customer_product_variant (customerId, productId, variantId),
        INDEX IDX_wishlists_customerId (customerId),
        CONSTRAINT FK_wishlists_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT FK_wishlists_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT FK_wishlists_variant FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
  }
}
