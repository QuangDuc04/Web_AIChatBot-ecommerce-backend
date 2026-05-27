/**
 * FAQ Matcher Service
 *
 * Intercepts common policy/info questions BEFORE they hit the Gemini API,
 * saving API credits for questions that have fixed, well-known answers.
 *
 * Matching strategy:
 *   1. Lowercase the raw message.
 *   2. Also normalize it (strips conversational prefixes like "cho mình hỏi").
 *   3. Check if either form includes any of the FAQ entry's patterns.
 */

import { ChatQuestionType } from '../../entities/ChatKnowledge';
import { normalizeChatQuestion, removeDiacritics } from '../../utils/search-query.util';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface FAQMatch {
  answer: string;
  questionType: ChatQuestionType;
}

interface FAQEntry {
  patterns: string[];
  answer: string;
  questionType: ChatQuestionType;
}

// ────────────────────────────────────────────────────────────────
// FAQ entries
// ────────────────────────────────────────────────────────────────

const FAQ_ENTRIES: FAQEntry[] = [
  // --- Shipping ---
  {
    patterns: [
      'giao hàng',
      'ship',
      'vận chuyển',
      'phí ship',
      'phí giao',
      'bao lâu nhận',
      'mấy ngày nhận',
    ],
    answer:
      'Dạ mình giao hàng toàn quốc ạ! Sản phẩm được đóng gói cẩn thận, có hộp chống sốc và bảo hiểm vận chuyển. Nội thành Hà Nội và TP.HCM anh/chị nhận trong khoảng 1–2 ngày làm việc, các khu vực khác thì 2–4 ngày ạ (không tính Lễ/Tết). Anh/chị cho mình biết sản phẩm cần mua, mình báo giá ship chính xác liền nhé!',
    questionType: ChatQuestionType.POLICY,
  },

  // --- Returns ---
  {
    patterns: ['đổi trả', 'trả hàng', 'hoàn tiền', 'hàng lỗi'],
    answer:
      'Dạ mình hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày anh/chị nhận hàng ạ, với điều kiện sản phẩm còn nguyên hộp, đầy đủ phụ kiện và chưa qua sử dụng. Lưu ý nhỏ là anh/chị quay video lúc mở hộp giúp mình nha, để nếu có vấn đề gì mình xử lý được nhanh hơn ạ. Trường hợp lỗi do nhà sản xuất thì mình chịu toàn bộ phí ship đổi trả, hoàn tiền trong 7–10 ngày làm việc. Lưu ý là sản phẩm giảm giá, khuyến mãi hoặc quà tặng sẽ không áp dụng đổi trả nha anh/chị. Liên hệ hotline 0353.643.396 hoặc email son.lequang97@gmail.com để mình hỗ trợ ngay nhé!',
    questionType: ChatQuestionType.POLICY,
  },

  // --- Warranty ---
  {
    patterns: ['bảo hành', 'warranty', 'hư hỏng', 'sửa chữa'],
    answer:
      'Dạ sản phẩm bên mình được bảo hành chính hãng 12 tháng ạ (iPhone bảo hành Apple, laptop và máy tính bảng bảo hành theo hãng). Nếu sản phẩm bị lỗi phần cứng do nhà sản xuất trong vòng 7 ngày kể từ ngày nhận, mình sẽ đổi máy mới hoặc hoàn tiền cho anh/chị. Anh/chị nhớ giữ lại hộp, đầy đủ phụ kiện và video mở hộp làm bằng chứng giúp mình. Liên hệ hotline 0353.643.396 hoặc email son.lequang97@gmail.com để mình xử lý nhanh nhất nhé!',
    questionType: ChatQuestionType.POLICY,
  },

  // --- Payment methods ---
  {
    patterns: [
      'thanh toán',
      'trả tiền',
      'chuyển khoản',
      'cod',
      'phương thức thanh toán',
      'phương thức trả',
      'phương thức mua',
    ],
    answer:
      'Dạ mình hỗ trợ nhiều hình thức thanh toán để anh/chị chọn cho tiện ạ:\n• COD — nhận hàng rồi thanh toán luôn tại nhà, không phát sinh thêm chi phí.\n• Thanh toán tại cửa hàng — đến trực tiếp showroom tại Khu phố Chiêu Liêu, Phường Tân Đông Hiệp, Dĩ An, Bình Dương.\n• Chuyển khoản ngân hàng Vietcombank — STK: 0123456789, Đức điện thoại. Nội dung CK: [Mã đơn hàng] - [Tên khách hàng].\nAnh/chị thấy cách nào thuận tiện nhất thì chọn nha, mình hỗ trợ liền ạ!',
    questionType: ChatQuestionType.POLICY,
  },

  // --- Contact ---
  {
    patterns: [
      'liên hệ',
      'hotline',
      'số điện thoại',
      'địa chỉ cửa hàng',
      'địa chỉ shop',
      'cửa hàng ở',
      'showroom',
    ],
    answer:
      'Dạ anh/chị liên hệ mình qua:\n• Hotline/Zalo: 0353.643.396 (8h–20h, Thứ Hai – Chủ nhật).\n• Email: son.lequang97@gmail.com.\n• Địa chỉ: Khu phố Chiêu Liêu, Phường Tân Đông Hiệp, Dĩ An, Bình Dương.\nMình luôn sẵn sàng hỗ trợ anh/chị ạ!',
    questionType: ChatQuestionType.GENERAL,
  },

  // --- Business hours ---
  {
    patterns: [
      'giờ làm việc',
      'mấy giờ mở',
      'thời gian làm việc',
      'mở cửa',
    ],
    answer:
      'Dạ mình làm việc từ 8h đến 20h, từ Thứ Hai đến Chủ nhật luôn ạ. Anh/chị cứ nhắn tin bất cứ lúc nào trong khung giờ này, mình sẽ phản hồi sớm nhất có thể nhé!',
    questionType: ChatQuestionType.GENERAL,
  },

  // --- How to order ---
  {
    patterns: [
      'cách đặt hàng',
      'đặt hàng như thế nào',
      'mua hàng thế nào',
      'quy trình đặt',
    ],
    answer:
      'Dạ anh/chị đặt hàng ngay tại đây rất nhanh ạ! Chỉ cần cho mình biết sản phẩm muốn mua (tên model, màu sắc, dung lượng), số lượng, tên, số điện thoại và địa chỉ nhận hàng — mình sẽ tạo đơn và gửi link xác nhận liền luôn. Ngoài ra anh/chị cũng có thể đặt trực tiếp trên website nếu tiện nha!',
    questionType: ChatQuestionType.GENERAL,
  },

  // --- Inspection on delivery ---
  {
    patterns: [
      'kiểm hàng',
      'kiểm tra hàng',
      'mở hàng',
      'nhận hàng',
    ],
    answer:
      'Dạ khi nhận hàng, anh/chị nhớ quay video lúc mở hộp giúp mình nha! Kiểm tra: hộp còn nguyên seal, IMEI/serial trên hộp khớp với máy, đầy đủ phụ kiện theo hộp, màn hình và thân máy không trầy xước. Nếu phát hiện vấn đề, anh/chị liên hệ ngay hotline 0353.643.396 trong vòng 30 phút kể từ khi nhận, mình sẽ xử lý liền ạ!',
    questionType: ChatQuestionType.POLICY,
  },

  // --- Authenticity / IMEI ---
  {
    patterns: [
      'hàng chính hãng',
      'hàng fake',
      'hàng nhái',
      'hàng xách tay',
      'imei',
      'serial',
      'nguồn gốc',
      'xuất xứ',
    ],
    answer:
      'Dạ 100% sản phẩm bên mình là hàng chính hãng, có đầy đủ hộp, phụ kiện và tem bảo hành của nhà sản xuất ạ. iPhone nhập chính ngạch, có thể kiểm tra IMEI trực tiếp trên website Apple. Laptop và máy tính bảng đều có hóa đơn VAT đầy đủ. Anh/chị hoàn toàn có thể kiểm tra IMEI/serial trên website nhà sản xuất ngay sau khi nhận máy để xác minh nhé!',
    questionType: ChatQuestionType.POLICY,
  },
];

// ────────────────────────────────────────────────────────────────
// Matcher
// ────────────────────────────────────────────────────────────────

/**
 * Try to match `message` against the static FAQ list.
 *
 * Returns a `FAQMatch` on the first hit, or `null` if no entry matches.
 * Matching is done on both the raw lowercased form and the normalized form
 * so that conversational wrappers (e.g. "cho mình hỏi giao hàng mấy ngày")
 * still produce a hit on the "giao hàng" pattern.
 */
/**
 * Keywords in the last assistant message that indicate an active ordering flow.
 * When the AI just asked for name/phone/address/quantity, the user's reply
 * should go to Gemini — not be intercepted by FAQ.
 */
const ORDERING_FLOW_PATTERNS = [
  'cho mình xin',
  'cho mình biết',
  'anh/chị cho',
  'cần mua bao nhiêu',
  'số lượng',
  'tên',
  'số điện thoại',
  'sđt',
  'địa chỉ nhận hàng',
  'địa chỉ giao',
  'xác nhận đơn',
  'tạo đơn',
  'đặt hàng',
  'link xác nhận',
].map(removeDiacritics);

function isInOrderingFlow(history: { role: string; content: string }[]): boolean {
  // Find the last assistant message
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') {
      const last = removeDiacritics(history[i].content.toLowerCase());
      return ORDERING_FLOW_PATTERNS.some((p) => last.includes(p));
    }
  }
  return false;
}

/**
 * Detect when the user is providing personal info (for ordering),
 * not asking a FAQ question. Patterns are matched against the
 * diacritic-free form so unaccented input ("ten: abc", "sdt: 090...")
 * is detected too.
 */
const PROVIDING_INFO_RE = /(?:ten|so dien thoai|sdt|dt|phone|dia chi|email)\s*[:=]\s*\S/i;
const PHONE_VALUE_RE = /(?:sdt|so dien thoai|dt|phone)\s*[:=]?\s*0\d{8,10}/i;
// Any message that contains a Vietnamese mobile number is likely providing contact info, not asking FAQ.
const BARE_PHONE_RE = /\b0[3-9]\d{8}\b/;

function isProvidingOrderInfo(raw: string): boolean {
  const s = removeDiacritics(raw.toLowerCase());
  return PROVIDING_INFO_RE.test(s) || PHONE_VALUE_RE.test(s) || BARE_PHONE_RE.test(raw);
}

export function matchFAQ(
  message: string,
  history: { role: string; content: string }[] = [],
): FAQMatch | null {
  // Skip FAQ when conversation is in an ordering flow
  if (isInOrderingFlow(history)) return null;

  // Skip FAQ when user is providing personal info (no history fallback)
  if (isProvidingOrderInfo(message)) return null;

  const lowerStripped = removeDiacritics(message.toLowerCase());
  const normalized = normalizeChatQuestion(message); // already diacritic-free

  for (const entry of FAQ_ENTRIES) {
    for (const pattern of entry.patterns) {
      const patternStripped = removeDiacritics(pattern);
      if (lowerStripped.includes(patternStripped) || normalized.includes(patternStripped)) {
        return { answer: entry.answer, questionType: entry.questionType };
      }
    }
  }

  return null;
}
