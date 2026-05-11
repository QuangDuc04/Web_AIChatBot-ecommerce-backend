/**
 * End-to-end chatbot order flow test.
 * Run: npx ts-node src/scripts/test-chatbot-order.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { AIChatbotService } from '../services/ai/ai-chatbot.service';

const SESSION_ID = `test-order-${Date.now()}`;
const chatbot = new AIChatbotService();

async function send(message: string): Promise<string> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`👤 USER: ${message}`);
  const result = await chatbot.processMessage(SESSION_ID, message, 'http://localhost:4000');
  console.log(`🤖 BOT : ${result.reply}`);
  if (result.escalated) console.log('   [escalated to human]');
  return result.reply;
}

async function run() {
  await AppDataSource.initialize();
  console.log('✅ DB connected\n');
  console.log(`Session: ${SESSION_ID}`);

  // Step 1: Hỏi mua iPhone 14
  await send('toi muon mua iphone 14');

  // Step 2: Chọn 128GB
  const r2 = await send('iphone 14 128gb');

  // Step 3: Nếu bot hỏi thêm model, chọn tiếp; nếu hỏi số lượng thì trả lời
  if (r2.toLowerCase().includes('bao nhi')) {
    await send('2 chiec');
  } else {
    await send('iphone 14 128gb');
    await send('2 chiec');
  }

  // Step 4: Cung cấp SĐT
  await send('so dien thoai 0394324932');

  // Step 5: Cung cấp tên + địa chỉ
  await send('ten la Nguyen Van A, dia chi 123 Nguyen Trai, Quan 1, TP.HCM');

  // Step 6: Xác nhận đặt hàng
  const finalReply = await send('ok dat hang luon di');

  // Kiểm tra kết quả
  console.log('\n' + '═'.repeat(60));
  const hasRealToken = /\/confirm\/[a-f0-9\-]{10,}/.test(finalReply);
  const hasFakeToken = /\/confirm\/1234567890/.test(finalReply);
  const hasError = finalReply.includes('không tìm thấy') || finalReply.includes('xin loi');

  if (hasRealToken && !hasFakeToken) {
    console.log('✅ PASS: Link xác nhận có token thật');
    const match = finalReply.match(/\/confirm\/([a-zA-Z0-9\-]+)/);
    if (match) console.log(`   Token: ${match[1]}`);
  } else if (hasFakeToken) {
    console.log('❌ FAIL: Link vẫn là token bịa (1234567890)');
  } else if (hasError) {
    console.log('❌ FAIL: Không tìm thấy sản phẩm hoặc lỗi khác');
  } else {
    console.log('⚠️  Chưa ra link confirm — bot có thể đang hỏi thêm thông tin');
    console.log('   Reply cuối:', finalReply.slice(0, 200));
  }

  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
