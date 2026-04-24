import {
  normalizeChatQuestion,
  isSelfContainedQuestion,
  hasActiveTopicContext,
  isShortFollowUp,
} from '../utils/search-query.util';
import { matchFAQ } from '../services/ai/faq-matcher.service';

const cases: [string, string][] = [
  ['Tôi muốn mua giấy in bill K80 không ạ', 'toi muon mua giay in bill K80 khong a'],
  ['Cho mình hỏi giao hàng mấy ngày', 'Cho minh hoi giao hang may ngay'],
  ['Có bán máy in hóa đơn không?', 'Co ban may in hoa don khong?'],
  ['Cái đó giá bao nhiêu?', 'cai do gia bao nhieu?'],
  ['Khuyến mãi hôm nay thế nào?', 'khuyen mai hom nay the nao?'],
  ['Tên: Phat, SĐT: 0901234567', 'Ten: Phat, SDT: 0901234567'],
  ['Đổi trả hàng được không?', 'Doi tra hang duoc khong?'],
  ['Bảo hành bao lâu?', 'Bao hanh bao lau?'],
];

let pass = 0;
let fail = 0;
for (const [a, u] of cases) {
  const n1 = normalizeChatQuestion(a);
  const n2 = normalizeChatQuestion(u);
  const s1 = isSelfContainedQuestion(a);
  const s2 = isSelfContainedQuestion(u);
  const f1 = matchFAQ(a);
  const f2 = matchFAQ(u);
  const ok = n1 === n2 && s1 === s2 && !!f1 === !!f2;
  if (ok) pass++; else fail++;
  console.log(`[${ok ? 'OK  ' : 'DIFF'}] "${a}"  vs  "${u}"`);
  console.log(`       normalize: "${n1}" | "${n2}"`);
  console.log(`       selfContained: ${s1} | ${s2}`);
  console.log(`       faq: ${f1 ? f1.questionType : '-'} | ${f2 ? f2.questionType : '-'}`);
}
console.log(`\nPass: ${pass} | Fail: ${fail}`);

// ────────────────────────────────────────────────────────────────
// Context-sensitive follow-up detection
// ────────────────────────────────────────────────────────────────

console.log('\n=== Context-sensitive follow-up detection ===');
type ContextCase = {
  label: string;
  history: { role: string; content: string }[];
  message: string;
  expectSensitive: boolean;
};

const productHistory = [
  { role: 'user', content: 'giấy in bill K80 còn không?' },
  { role: 'assistant', content: 'Dạ còn ạ, giấy K80 giá 45.000đ/cuộn. Anh/chị cần số lượng bao nhiêu?' },
];

const contextCases: ContextCase[] = [
  {
    label: 'Follow-up "giá bao nhiêu?" after K80 context',
    history: productHistory,
    message: 'giá bao nhiêu?',
    expectSensitive: true,
  },
  {
    label: 'Follow-up "có khuyến mãi không?" after K80 context',
    history: productHistory,
    message: 'có khuyến mãi không?',
    expectSensitive: true,
  },
  {
    label: 'Standalone K80 question after K80 context (NOT follow-up)',
    history: productHistory,
    message: 'Giấy K80 80mm dùng cho máy POS nào?',
    expectSensitive: false,
  },
  {
    label: 'First-turn question — no history',
    history: [],
    message: 'giao hàng bao lâu?',
    expectSensitive: false,
  },
  {
    label: 'Follow-up with own anchor (máy in) — not context-sensitive',
    history: productHistory,
    message: 'máy in có ship không?',
    expectSensitive: false,
  },
];

let cPass = 0, cFail = 0;
for (const c of contextCases) {
  const active = hasActiveTopicContext(c.history);
  const followUp = isShortFollowUp(c.message);
  const sensitive = active && followUp;
  const ok = sensitive === c.expectSensitive;
  if (ok) cPass++; else cFail++;
  console.log(`[${ok ? 'OK  ' : 'DIFF'}] ${c.label}`);
  console.log(`       active=${active} | followUp=${followUp} | sensitive=${sensitive} | expect=${c.expectSensitive}`);
}
console.log(`\nContext Pass: ${cPass} | Fail: ${cFail}`);
