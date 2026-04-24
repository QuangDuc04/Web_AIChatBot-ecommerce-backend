/**
 * Direct test for chatbot tool outputs — bypasses Gemini so we can verify
 * tool response shape regardless of upstream AI availability.
 */
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ChatbotToolsService } from '../services/ai/chatbot-tools.service';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function main() {
  await AppDataSource.initialize();
  const svc = new ChatbotToolsService();

  console.log('═══ search_products("Giấy in hóa đơn K80x45") ═══');
  const search = await svc.executeTool('search_products', { query: 'Giấy in hóa đơn K80x45' }) as any;
  console.log(JSON.stringify(search, null, 2));
  console.log();

  // Validate first product
  const p = search?.products?.[0];
  if (p) {
    const checks = [
      ['sellingPrice là số', typeof p.sellingPrice === 'number'],
      ['sellingPrice > 0', p.sellingPrice > 0],
      ['originalPrice null hoặc > sellingPrice', p.originalPrice === null || p.originalPrice > p.sellingPrice],
      ['productUrl có giá trị', Boolean(p.productUrl)],
      [`productUrl chứa ${CLIENT_URL}`, p.productUrl?.includes(CLIENT_URL)],
      ['productUrl chứa slug sản phẩm', p.productUrl?.toLowerCase().includes('k80x45')],
    ] as [string, boolean][];
    for (const [label, ok] of checks) console.log(`  [${ok ? '✓' : '✗'}] ${label}`);
  }

  console.log('\n═══ search_products("giấy in hóa đơn k80") — phải trả nhiều variants ═══');
  const searchMany = await svc.executeTool('search_products', { query: 'giấy in hóa đơn k80' }) as any;
  console.log(`  total: ${searchMany?.total}`);
  (searchMany?.products || []).forEach((p: any) => {
    const price = `sellingPrice=${p.sellingPrice}, originalPrice=${p.originalPrice}`;
    console.log(`  • ${p.name} — ${price}`);
    console.log(`    url: ${p.productUrl}`);
  });

  console.log('\n═══ search_products("K80x45") — filter phải lọc chỉ K80x45 ═══');
  const searchFiltered = await svc.executeTool('search_products', { query: 'K80x45' }) as any;
  console.log(`  total: ${searchFiltered?.total}`);
  (searchFiltered?.products || []).forEach((p: any) => {
    console.log(`  • ${p.name}`);
  });
  const onlyK80x45 = (searchFiltered?.products || []).every((p: any) =>
    p.name.toLowerCase().includes('k80x45'),
  );
  console.log(`  [${onlyK80x45 ? '✓' : '✗'}] chỉ có sản phẩm K80x45`);

  // Detail test
  if (p?.id) {
    console.log('\n═══ get_product_detail(productId) ═══');
    const detail = await svc.executeTool('get_product_detail', { productId: p.id }) as any;
    console.log(JSON.stringify(detail, null, 2));
    const dchecks = [
      ['sellingPrice có giá trị', typeof detail?.sellingPrice === 'number'],
      ['sellingPrice <= originalPrice (nếu có)', detail?.originalPrice === null || detail?.sellingPrice <= detail?.originalPrice],
      ['productUrl có giá trị', Boolean(detail?.productUrl)],
    ] as [string, boolean][];
    for (const [label, ok] of dchecks) console.log(`  [${ok ? '✓' : '✗'}] ${label}`);
  }

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
