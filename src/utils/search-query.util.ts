/**
 * Search Query Analyzer — Elasticsearch-style query expansion for MySQL.
 *
 * Parses a raw search string into structured signals (phrases, model numbers,
 * variants, short words) so the scored search can weight each signal properly.
 */

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface AnalyzedQuery {
  /** Original trimmed query */
  original: string;
  /** All individual words */
  words: string[];
  /** Words >= 3 chars (usable in MySQL FULLTEXT) */
  fulltextWords: string[];
  /** Words < 3 chars — need LIKE because FULLTEXT drops them (Vietnamese: "in", "bộ", "lõi") */
  shortWords: string[];
  /** Contiguous phrases of 2–4 words, longest first */
  phrases: string[];
  /** Words containing digits — product model/spec numbers */
  modelNumbers: string[];
  /** Expanded variants of model numbers (e.g. "k80x80" → ["k80", "80x80", "80"]) */
  modelVariants: string[];
  /** Words without digits — product type/category descriptors */
  descriptiveWords: string[];
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Escape SQL LIKE wildcards in user input */
export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

/** Remove Vietnamese diacritics: "tiếng Việt" → "tieng Viet", "đặt hàng" → "dat hang". */
export function removeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// ────────────────────────────────────────────────────────────────
// Vietnamese chat normalization
// ────────────────────────────────────────────────────────────────

/** Common conversational prefixes (longest first for greedy match) */
const CHAT_PREFIXES = [
  'tôi muốn mua', 'tôi muốn tìm', 'tôi muốn hỏi', 'tôi muốn xem',
  'tôi cần mua', 'tôi cần tìm',
  'mình muốn mua', 'mình muốn tìm', 'mình muốn hỏi',
  'mình cần mua', 'mình cần tìm',
  'cho mình hỏi', 'cho mình tìm', 'cho mình xem',
  'cho tôi hỏi', 'cho tôi tìm', 'cho tôi xem',
  'bạn có bán', 'shop có bán', 'bên mình có',
  'tôi muốn', 'mình muốn', 'tôi cần', 'mình cần',
  'cho mình', 'cho tôi',
  'bạn có', 'shop có', 'có bán',
  'anh ơi', 'chị ơi', 'ad ơi', 'admin ơi',
  'xin chào', 'hello', 'hi',
];

/** Common conversational suffixes (longest first) */
const CHAT_SUFFIXES = [
  'không ạ', 'không vậy', 'được không', 'đi ạ',
  'giúm mình', 'giúp mình', 'giùm mình',
  'với ạ', 'không', 'nhé', 'nha', 'với', 'ạ',
];

/** Phrases that indicate the message depends on prior conversation context */
const CONTEXT_DEPENDENT = [
  'cái đó', 'cái này', 'cái kia', 'cái nào',
  'sản phẩm đó', 'sản phẩm này', 'sản phẩm trên',
  'loại đó', 'loại này', 'loại kia',
  'ở trên', 'bên trên', 'phía trên',
  'vậy thì', 'thế thì', 'ngoài ra',
  'cái vừa', 'cái mình vừa',
  // Phrases requesting detail/action on something already discussed
  'cho xem chi tiết', 'xem chi tiết', 'chi tiết sản phẩm',
  'cho mình xem', 'xem thêm', 'tìm hiểu thêm',
  'mua cái này', 'mua cái đó', 'đặt cái này', 'đặt cái đó',
  'loại a', 'loại b', 'loại c',
  'cái đầu tiên', 'cái thứ hai', 'cái thứ ba', 'cái cuối',
  'số 1', 'số 2', 'số 3',
];

/** Bản đồ từ đồng nghĩa: dạng chuẩn → danh sách từ đồng nghĩa (dài nhất trước) */
const SYNONYM_MAP: Record<string, string[]> = {
  'giá': ['bao nhiêu tiền', 'giá tiền như nào', 'giá tiền', 'giá cả', 'bao nhiêu', 'chi phí', 'phí'],
  'khuyến mãi': ['chương trình giảm giá', 'đang giảm giá', 'giảm giá', 'promotion', 'ưu đãi', 'sale', 'km'],
  'giao hàng': ['chuyển hàng', 'gửi hàng', 'vận chuyển', 'shipping', 'ship'],
  'đổi trả': ['hoàn trả', 'trả hàng', 'đổi hàng', 'return'],
  'thanh toán': ['trả tiền', 'chuyển khoản', 'payment', 'pay'],
  'còn hàng': ['có hàng không', 'hết hàng chưa', 'còn không', 'có hàng', 'hết hàng', 'tồn kho', 'in stock'],
  'máy in': ['máy in hóa đơn', 'máy in nhiệt', 'máy in bill', 'printer'],
  'giấy in': ['giấy in hóa đơn', 'giấy in nhiệt', 'giấy in bill', 'giấy nhiệt', 'thermal paper'],
  'tem': ['tem nhãn', 'tem decal', 'decal', 'label', 'sticker'],
  'mực in': ['ribbon', 'cartridge', 'mực'],
};

// Pre-computed diacritic-free forms so we can match accented and unaccented input
// (e.g. "giao hàng" and "giao hang") with the same rule set.
const CHAT_PREFIXES_STRIPPED = CHAT_PREFIXES.map(removeDiacritics);
const CHAT_SUFFIXES_STRIPPED = CHAT_SUFFIXES.map(removeDiacritics);
const SYNONYM_REPLACEMENTS_STRIPPED = (() => {
  const list: { from: string; to: string }[] = [];
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    const canonicalStripped = removeDiacritics(canonical);
    for (const synonym of synonyms) {
      list.push({ from: removeDiacritics(synonym), to: canonicalStripped });
    }
  }
  return list.sort((a, b) => b.from.length - a.from.length);
})();

/**
 * Thay thế các từ đồng nghĩa bằng dạng chuẩn (trên đầu vào đã loại dấu).
 * Được gọi bởi `normalizeChatQuestion`.
 */
export function applySynonyms(text: string): string {
  let result = text;
  for (const { from, to } of SYNONYM_REPLACEMENTS_STRIPPED) {
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * Chuẩn hóa câu hỏi chat: bỏ dấu tiếng Việt, lowercase, strip prefix/suffix,
 * rồi áp dụng từ đồng nghĩa. Đầu ra luôn KHÔNG DẤU để khớp cả trường hợp
 * người dùng gõ telex hoặc bỏ dấu.
 *   "Tôi muốn mua giấy in bill K80 không ạ" → "giay in bill k80"
 *   "toi muon mua giay in bill K80 khong a" → "giay in bill k80"
 */
export function normalizeChatQuestion(raw: string): string {
  const base = removeDiacritics(raw.trim().toLowerCase());
  let text = base;

  for (const p of CHAT_PREFIXES_STRIPPED) {
    if (text.startsWith(p)) { text = text.slice(p.length).trim(); break; }
  }
  for (const s of CHAT_SUFFIXES_STRIPPED) {
    if (text.endsWith(s)) { text = text.slice(0, -s.length).trim(); break; }
  }

  text = applySynonyms(text);

  // If too short after stripping, fall back to the full message (still stripped).
  if (text.split(/\s+/).filter(Boolean).length < 2) return applySynonyms(base);
  return text;
}

/** Từ khóa FAQ — nếu câu hỏi chứa bất kỳ từ nào trong này thì luôn self-contained */
const FAQ_KEYWORDS = new Set(
  [
    'giao hàng', 'ship', 'vận chuyển',
    'đổi trả', 'trả hàng', 'bảo hành',
    'thanh toán', 'chuyển khoản',
    'khuyến mãi', 'giảm giá', 'ưu đãi',
    'liên hệ', 'hotline',
    'giờ làm việc', 'mở cửa',
    'đặt hàng', 'mua hàng',
    'còn hàng', 'hết hàng',
  ].map(removeDiacritics),
);

const CONTEXT_DEPENDENT_STRIPPED = CONTEXT_DEPENDENT.map(removeDiacritics);

/**
 * Check if a chat message is self-contained (has enough context on its own)
 * vs context-dependent (needs prior conversation to understand).
 *
 *   "giấy in bill K80"       → true  (product + model)
 *   "tôi muốn mua tem decal" → true  (product name)
 *   "giá bao nhiêu?"         → false (price of WHAT?)
 *   "cái đó còn hàng không"  → false (which product?)
 *   "ok đặt hàng đi"         → false (context-dependent)
 *   "có giao hàng không"     → true  (FAQ keyword)
 */
export function isSelfContainedQuestion(message: string): boolean {
  // Match against diacritic-free form so "cái đó" and "cai do" both trigger.
  const lower = removeDiacritics(message.toLowerCase());

  // Contains explicit context-dependent phrases → NOT self-contained
  for (const pattern of CONTEXT_DEPENDENT_STRIPPED) {
    if (lower.includes(pattern)) return false;
  }

  const normalized = normalizeChatQuestion(message);
  const words = normalized.split(/\s+/).filter(Boolean);

  // Too short → likely context-dependent ("giá?", "có", "ok")
  if (words.length < 2) return false;

  // Contains FAQ keyword → always self-contained
  for (const kw of FAQ_KEYWORDS) {
    if (normalized.includes(kw)) return true;
  }

  // Has a model number (word with digit) → self-contained ("giấy K80", "tem 40x30")
  if (words.some((w) => /\d/.test(w))) return true;

  // Has enough descriptive words → likely a standalone question
  if (words.length >= 3) return true;

  return false;
}

/** Product/topic anchor words — their presence in recent turns establishes context. */
const TOPIC_ANCHORS = /\b(giay|tem|decal|may in|muc|ribbon|cartridge|hoa don|nhiet|in bill)\b/;

/**
 * True if recent conversation turns have established a specific product/topic
 * that a short follow-up question would implicitly refer to.
 *
 * Signals (on the last 4 messages, accent-insensitive):
 *   - A model number / SKU-like token (digits >= 2 adjacent to letters or alone)
 *   - A product-type anchor word ("giấy", "tem", "máy in", ...)
 */
export function hasActiveTopicContext(
  history: { role: string; content: string }[],
): boolean {
  if (history.length === 0) return false;
  const recent = removeDiacritics(
    history
      .slice(-4)
      .map((m) => m.content)
      .join(' ')
      .toLowerCase(),
  );
  if (/\b[a-z]*\d{2,}\b|\b\d{2,}[a-z]*\b/.test(recent)) return true;
  if (TOPIC_ANCHORS.test(recent)) return true;
  return false;
}

/**
 * True if `userMessage` reads like an implicit follow-up (few words, no model
 * number of its own) that relies on prior conversation to make sense.
 *   "giá bao nhiêu?", "còn hàng chứ?", "có khuyến mãi không?" → true
 *   "Giấy K80 giá bao nhiêu?" → false (has own anchor)
 */
export function isShortFollowUp(userMessage: string): boolean {
  const stripped = removeDiacritics(userMessage.toLowerCase());
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length >= 5) return false;
  if (/\d/.test(stripped)) return false;
  if (TOPIC_ANCHORS.test(stripped)) return false;
  return true;
}

// ────────────────────────────────────────────────────────────────
// Main analyzer
// ────────────────────────────────────────────────────────────────

export function analyzeSearchQuery(raw: string): AnalyzedQuery {
  const original = raw.trim();
  // Cap at 8 words to keep SQL manageable
  const words = original.split(/\s+/).filter(Boolean).slice(0, 8);

  const fulltextWords = words.filter((w) => w.length >= 3);
  const shortWords = words.filter((w) => w.length < 3);

  // ── Contiguous phrases (2–4 consecutive words), longest first ──
  const phrases: string[] = [];
  const maxPhraseLen = Math.min(words.length, 4);
  for (let len = maxPhraseLen; len >= 2; len--) {
    for (let start = 0; start <= words.length - len; start++) {
      phrases.push(words.slice(start, start + len).join(' '));
    }
  }

  // ── Model numbers & variants ──
  const modelNumbers = words.filter((w) => /\d/.test(w));
  const descriptiveWords = words.filter((w) => !/\d/.test(w));

  const modelVariants: string[] = [];
  const seen = new Set(modelNumbers.map((m) => m.toLowerCase()));

  for (const model of modelNumbers) {
    // Split on dimension separators: x, ×, -, *, /
    const parts = model.split(/[x×\-*/]/i).filter((p) => p.length >= 2);
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (!seen.has(lower)) {
        modelVariants.push(part);
        seen.add(lower);
      }
    }
    // Letter+number prefix: "k80x80" → "k80"
    const prefix = model.match(/^([a-zA-Z]+\d+)/);
    if (prefix) {
      const lower = prefix[1].toLowerCase();
      if (!seen.has(lower)) {
        modelVariants.push(prefix[1]);
        seen.add(lower);
      }
    }
  }

  return {
    original,
    words,
    fulltextWords,
    shortWords,
    phrases,
    modelNumbers,
    modelVariants,
    descriptiveWords,
  };
}
