/**
 * Test scored search directly against DB — no Gemini, no Redis.
 * Usage: npx ts-node src/scripts/test-scored-search.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ProductRepository } from '../repositories/product.repository';
import { analyzeSearchQuery } from '../utils/search-query.util';

const TEST_QUERIES = [
  'giấy in bill k80x80',
  'giấy in bill',
  'giấy in nhiệt',
  'giấy in',
  'máy in bill',
  'máy in hóa đơn',
  'tem decal',
  'K80',
  'giấy in bill K57',
  'mực in',
  'giấy a4',
];

async function main() {
  await AppDataSource.initialize();
  console.log('DB connected.\n');

  const repo = new ProductRepository();

  console.log('='.repeat(90));
  console.log('SCORED SEARCH TEST');
  console.log('='.repeat(90));

  for (const query of TEST_QUERIES) {
    const analyzed = analyzeSearchQuery(query);

    console.log(`\n${'─'.repeat(90)}`);
    console.log(`QUERY: "${query}"`);
    console.log(`  words:       [${analyzed.words.join(', ')}]`);
    console.log(`  phrases:     [${analyzed.phrases.join(' | ')}]`);
    console.log(`  models:      [${analyzed.modelNumbers.join(', ')}]`);
    console.log(`  variants:    [${analyzed.modelVariants.join(', ')}]`);
    console.log(`  descriptive: [${analyzed.descriptiveWords.join(', ')}]`);

    const start = performance.now();
    const result = await repo.scoredSearch(query, { limit: 5 });
    const elapsed = (performance.now() - start).toFixed(1);

    console.log(`  TIME: ${elapsed}ms | RESULTS: ${result.total}`);

    if (result.items.length === 0) {
      console.log('  (no results)');
    } else {
      for (const p of result.items) {
        const cat = (p as any).category?.name || '-';
        const brand = (p as any).brand?.name || '-';
        const stock = (p.quantity ?? 0) > 0 ? 'IN STOCK' : 'OUT';
        console.log(
          `  → [${cat}] ${p.name} | ${Number(p.price).toLocaleString('vi-VN')}đ | ${brand} | ${stock}`,
        );
      }
    }
  }

  console.log(`\n${'='.repeat(90)}`);
  console.log('DONE');
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
