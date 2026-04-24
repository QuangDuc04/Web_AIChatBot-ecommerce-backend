/**
 * Test ChatKnowledge scored matching + Redis cache timing.
 * Usage: NODE_ENV=production npx ts-node src/scripts/test-knowledge-match.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ChatKnowledgeRepository } from '../repositories/chatKnowledge.repository';
import { ChatQuestionType } from '../entities/ChatKnowledge';
import { CacheUtil } from '../utils/cache.util';
import { analyzeSearchQuery } from '../utils/search-query.util';

// ── Simulated cached questions ──
const SEED_QUESTIONS = [
  { question: 'giấy in bill k80x80', questionType: ChatQuestionType.PRODUCT_INQUIRY, answer: 'Dạ, mình có Giấy in hóa đơn Oji K80x80 giá 24.000đ/cuộn ạ.' },
  { question: 'máy in hóa đơn', questionType: ChatQuestionType.PRODUCT_INQUIRY, answer: 'Mình có Máy in hóa đơn N1 giá 1.650.000đ ạ.' },
  { question: 'tem decal 40x30', questionType: ChatQuestionType.PRODUCT_INQUIRY, answer: 'Tem decal nhiệt 40x30x900 giá 18.000đ ạ.' },
  { question: 'tôi muốn mua giấy in bill', questionType: ChatQuestionType.PRODUCT_INQUIRY, answer: 'Mình có nhiều loại giấy in bill: K80x80, K80x65, K57x38...' },
  { question: 'tôi muốn mua giấy in hóa đơn k80', questionType: ChatQuestionType.PRODUCT_INQUIRY, answer: 'Dạ, Giấy in hóa đơn Oji K80x80 giá 24.000đ, K80x65 giá 10.000đ ạ.' },
];

// ── Test queries vs expected match ──
const TEST_CASES = [
  { query: 'giấy in bill k80x80', expectMatch: 'giấy in bill k80x80' },
  { query: 'giấy in bill k80', expectMatch: 'giấy in bill k80x80' },
  { query: 'giấy in bill', expectMatch: 'tôi muốn mua giấy in bill' },
  { query: 'giấy in', expectMatch: null },
  { query: 'giấy a4', expectMatch: null },
  { query: 'máy in hóa đơn', expectMatch: 'máy in hóa đơn' },
  { query: 'máy in bill', expectMatch: null },
  { query: 'tem decal 40x30', expectMatch: 'tem decal 40x30' },
  { query: 'tem decal', expectMatch: null },
  { query: 'mực in', expectMatch: null },
  // ── User's real test case: "mua" vs "tìm" ──
  { query: 'tôi muốn tìm giấy in hóa đơn k80', expectMatch: 'tôi muốn mua giấy in hóa đơn k80' },
  { query: 'giấy in hóa đơn k80', expectMatch: 'tôi muốn mua giấy in hóa đơn k80' },
];

async function main() {
  await AppDataSource.initialize();
  console.log('DB connected.\n');

  const repo = new ChatKnowledgeRepository();

  // ── Seed test data ──
  console.log('Seeding test knowledge entries...');
  const seeded: string[] = [];
  for (const seed of SEED_QUESTIONS) {
    const entry = await repo.save({
      ...seed,
      toolName: 'search_products',
      toolArgs: { query: seed.question },
      expiresAt: new Date(Date.now() + 2 * 3600_000),
    });
    seeded.push(entry.id);
    console.log(`  + "${seed.question}"`);
  }

  // ── Test DB Knowledge matching ──
  console.log('\n' + '='.repeat(90));
  console.log('CHATKNOWLEDGE SCORED MATCHING');
  console.log('='.repeat(90));

  for (const tc of TEST_CASES) {
    const analyzed = analyzeSearchQuery(tc.query);
    const start = performance.now();
    const match = await repo.findSimilar(tc.query);
    const elapsed = (performance.now() - start).toFixed(1);

    const matched = match?.question || null;
    const pass = matched === tc.expectMatch;
    const icon = pass ? '✅' : '❌';

    console.log(`\n${icon} Query: "${tc.query}" (${elapsed}ms)`);
    console.log(`   words: [${analyzed.words.join(', ')}] | phrases: [${analyzed.phrases.join(' | ')}]`);
    console.log(`   Expected: ${tc.expectMatch ? `"${tc.expectMatch}"` : '(no match)'}`);
    console.log(`   Got:      ${matched ? `"${matched}"` : '(no match)'}`);
    if (match && !pass) {
      console.log(`   Answer:   ${match.answer.slice(0, 80)}...`);
    }
  }

  // ── Test Redis cache timing ──
  console.log('\n' + '='.repeat(90));
  console.log('REDIS CACHE TIMING');
  console.log('='.repeat(90));

  const testData = { total: 5, products: [{ id: '1', name: 'Test', price: 1000 }] };
  const cacheKey = 'chatbot:search:test-timing';

  // Write
  let start = performance.now();
  await CacheUtil.set(cacheKey, testData, 60);
  console.log(`\n  Redis SET: ${(performance.now() - start).toFixed(2)}ms`);

  // Read (hit)
  start = performance.now();
  const cached = await CacheUtil.get(cacheKey);
  console.log(`  Redis GET (hit): ${(performance.now() - start).toFixed(2)}ms`);

  // Read (miss)
  start = performance.now();
  await CacheUtil.get('chatbot:search:nonexistent-key-12345');
  console.log(`  Redis GET (miss): ${(performance.now() - start).toFixed(2)}ms`);

  // Cleanup
  await CacheUtil.del(cacheKey);

  // Compare: DB scored search vs Redis
  console.log('\n  Comparison:');
  const dbStart = performance.now();
  await repo.findSimilar('giấy in bill k80x80');
  const dbTime = performance.now() - dbStart;

  const redisStart = performance.now();
  await CacheUtil.get('chatbot:search:giấy in bill k80x80');
  const redisTime = performance.now() - redisStart;

  console.log(`  DB findSimilar: ${dbTime.toFixed(2)}ms`);
  console.log(`  Redis GET:      ${redisTime.toFixed(2)}ms`);
  console.log(`  Speedup:        ${(dbTime / Math.max(redisTime, 0.01)).toFixed(1)}x`);

  // ── Cleanup seeded data ──
  console.log('\nCleaning up test data...');
  for (const id of seeded) {
    await AppDataSource.getRepository('ChatKnowledge').delete(id);
  }

  console.log('\n' + '='.repeat(90));
  console.log('DONE');
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
