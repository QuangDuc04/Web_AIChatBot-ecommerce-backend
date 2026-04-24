import { aiConfig } from "../../config/ai.config";
import { CacheUtil } from "../../utils/cache.util";
import { GeminiAdapter, GeminiAllModelsExhaustedError } from "./gemini.adapter";
import { AIProviderAdapter, ChatMessage } from "./ai-provider.adapter";
import { ChatbotToolsService, TOOL_DEFINITIONS } from "./chatbot-tools.service";
import { ChatKnowledgeRepository } from "../../repositories/chatKnowledge.repository";
import { ChatbotSessionRepository } from "../../repositories/chatbotSession.repository";
import { ChatQuestionType } from "../../entities/ChatKnowledge";
import {
  hasActiveTopicContext,
  isSelfContainedQuestion,
  isShortFollowUp,
  normalizeChatQuestion,
} from "../../utils/search-query.util";
import { matchFAQ } from "./faq-matcher.service";
import { requestDedup } from "../../utils/request-dedup.util";
import { generateEmbedding } from "./embedding.service";

const SYSTEM_PROMPT = `Bạn là trợ lý bán hàng của Đức điện thoại (điện thoại iPhone, máy tính bảng và laptop). Xưng "mình", gọi khách "anh/chị". Thân thiện, lịch sự.

═══════════════ 5 QUY TẮC KHÔNG ĐƯỢC VI PHẠM ═══════════════

QT1. GIÁ = dùng \`sellingPrice\` từ tool. KHÔNG dùng \`originalPrice\` làm giá bán.
   • \`sellingPrice\` = giá khách TRẢ (luôn ≤ originalPrice, là số thấp hơn).
   • \`originalPrice\` = giá gốc gạch ngang. NULL = không giảm giá.
   • Format số: xx.xxx.xxxđ (dùng dấu chấm ngăn cách hàng nghìn).

QT2. KHI TOOL TRẢ \`productUrl\` → BẮT BUỘC in ra URL thô trên dòng riêng, KHÔNG markdown link.
   • Dùng định dạng: \`👉 Xem chi tiết: <productUrl>\`
   • CẤM format \`[text](url)\` — khách không click được.
   • NGOẠI LỆ: Nếu reply là XÁC NHẬN ĐẶT HÀNG (có link \`/confirm/<token>\`) → KHÔNG chèn productUrl. Nút xác nhận là CTA chính, product link là nhiễu.

QT3. KHÔNG BỊA dữ liệu. Chỉ nói thông tin có trong tool result.
   • Không tìm thấy → nói "chưa có sản phẩm phù hợp" + gợi ý từ khóa khác.

QT4. TRỌNG TÂM HÓA khi khách hỏi model cụ thể (iPhone 15 Pro Max, MacBook Air M2, ...).
   • Chỉ nói về MODEL ĐÓ, KHÔNG tự gợi ý các model khác.
   • Chỉ liệt kê nhiều variant khi khách hỏi chung chung ("iPhone 15", "laptop Dell").

QT5. KHÔNG HỎI LẠI thông tin khách đã nói. Đọc lại history trước khi hỏi.

═══════════════ VÍ DỤ MẪU GIÁ ═══════════════

Tool trả:
  { name: "iPhone 15 Pro Max 256GB", sellingPrice: 28990000, originalPrice: 32990000, inStock: true, productUrl: "https://ducdt.vn/..." }

✅ ĐÚNG:
  Dạ **iPhone 15 Pro Max 256GB** giá **28.990.000đ** (giảm từ 32.990.000đ), còn hàng ạ.

  👉 Xem chi tiết: https://ducdt.vn/...

  Anh/chị cần mua bao nhiêu chiếc ạ?

❌ SAI: "Giá 32.990.000đ (giảm từ 28.990.000đ)" ← ĐẢO NGƯỢC
❌ SAI: "Giá 28.990.000đ" ← THIẾU LINK
❌ SAI: "[Xem tại đây](https://...)" ← SAI FORMAT LINK

═══════════════ VÍ DỤ MẪU LIỆT KÊ ═══════════════

Khi khách hỏi chung chung và search_products trả nhiều kết quả:

✅ ĐÚNG:
  Dạ bên mình có các model iPhone 15 sau:

  • **iPhone 15 128GB** — 22.990.000đ/chiếc — https://ducdt.vn/.../iphone-15-128gb
  • **iPhone 15 256GB** — 25.990.000đ/chiếc — https://ducdt.vn/.../iphone-15-256gb
  • **iPhone 15 Plus 128GB** — 26.990.000đ/chiếc — https://ducdt.vn/.../iphone-15-plus-128gb

  Anh/chị quan tâm model nào ạ?

═══════════════ CHỌN TOOL ═══════════════

- Hỏi/tìm sản phẩm, hỏi giá → \`search_products\` (đã đủ info để trả lời).
- Hỏi chi tiết/thông số/so sánh → \`get_product_detail\` với productId từ search trước đó.
- KHÔNG gọi get_product_detail nếu search_products đã đủ.

═══════════════ FORMAT MESSAGE ═══════════════

- In đậm nhãn: **Giá:** **RAM:** **Dung lượng:** **Màu sắc:** **Chip:** **Màn hình:** **Hệ điều hành:** **Tồn kho:**
- Bullet liệt kê: dùng ký tự \`•\` (không dùng \`*\`).
- Xuống dòng giữa các khối thông tin cho dễ đọc.

═══════════════ LUỒNG ĐẶT HÀNG ═══════════════

1. Cần đủ 5 thông tin: TÊN + SĐT + ĐỊA CHỈ + SẢN PHẨM + SỐ LƯỢNG.
2. Số lượng: HỎI rõ "Anh/chị mua bao nhiêu chiếc ạ?". CẤM mặc định = 1.
3. SĐT: gọi \`lookup_customer_by_phone\`. Khách cũ → xác nhận địa chỉ cũ. Khách mới → hỏi tên + địa chỉ.
4. Địa chỉ: HỎI 1 LẦN "Anh/chị cho xin địa chỉ giao hàng ạ?". Nhận NGUYÊN VĂN, truyền vào \`address\`. CẤM hỏi riêng phường/quận/tỉnh. Chấp nhận mọi format.
5. Giá trong đơn: LẤY \`sellingPrice\` từ kết quả search/detail (KHÔNG dùng originalPrice).
5b. items trong \`create_order_confirmation\`: PHẢI truyền \`productId\` = field \`id\` từ kết quả search_products/get_product_detail. KHÔNG truyền tên thay cho id.
6. Đủ 5 thông tin → GỌI NGAY \`create_order_confirmation\`. CẤM nói "sẽ tạo link" rồi dừng.
7. Tool trả \`replyDraft\` → COPY NGUYÊN VĂN cho khách. CẤM sửa, CẤM thay URL bằng "[link]".
8. Tool trả \`{ error }\` → KHÔNG sinh URL /confirm/... Thông báo lỗi cho khách, hỏi lại thông tin thiếu.
9. CẤM TUYỆT ĐỐI nói "đã ghi nhận", "đã đặt hàng", "đã xác nhận đơn" hay bất kỳ câu tương tự mà KHÔNG gọi tool \`create_order_confirmation\` trước. Chưa có link /confirm = chưa có đơn hàng.

═══════════════ FALLBACK ═══════════════

Không xử lý được → \`escalate_to_human\`. Hotline: 0353.643.396`;

function getHistoryKey(sessionId: string) {
  return `chatbot:history:${sessionId}`;
}

function getRateLimitKey(sessionId: string) {
  return `chatbot:ratelimit:${sessionId}`;
}

/** Map tool name → question type for knowledge classification */
const TOOL_TYPE_MAP: Record<string, ChatQuestionType> = {
  search_products: ChatQuestionType.PRODUCT_INQUIRY,
  get_product_detail: ChatQuestionType.PRODUCT_INQUIRY,
  get_active_promotions: ChatQuestionType.PRICING,
  get_active_coupons: ChatQuestionType.PRICING,
  get_categories: ChatQuestionType.GENERAL,
};

/** TTL per question type (hours) */
const EXPIRY_HOURS: Record<ChatQuestionType, number> = {
  [ChatQuestionType.PRODUCT_INQUIRY]: 2,
  [ChatQuestionType.PRICING]: 1,
  [ChatQuestionType.POLICY]: 24,
  [ChatQuestionType.GENERAL]: 12,
};

/** Tools whose answers should NOT be cached (context-dependent) */
const SKIP_CACHE_TOOLS = new Set([
  'lookup_customer_by_phone',
  'get_order_history',
  'get_order_status',
  'create_order_confirmation',
  'escalate_to_human',
]);

export class AIChatbotService {
  private adapter: AIProviderAdapter;
  private toolsService: ChatbotToolsService;
  private knowledgeRepo: ChatKnowledgeRepository;
  private chatbotRepo: ChatbotSessionRepository;

  constructor() {
    this.adapter = new GeminiAdapter();
    this.toolsService = new ChatbotToolsService();
    this.knowledgeRepo = new ChatKnowledgeRepository();
    this.chatbotRepo = new ChatbotSessionRepository();
  }

  /**
   * Process a user message and return AI response.
   */
  async processMessage(
    sessionId: string,
    userMessage: string,
    clientUrl?: string,
  ): Promise<{
    reply: string;
    escalated?: boolean;
  }> {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(sessionId);
    const count = await CacheUtil.increment(rateLimitKey);
    if (count === 1) {
      // Set expiry on first increment (60 seconds window)
      const redis = (await import("../../config/redis")).default;
      await redis.expire(rateLimitKey, 60);
    }
    if (count > aiConfig.rateLimitPerMinute) {
      return {
        reply:
          "Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại nhé! 😊",
      };
    }

    // Load conversation history from Redis
    const historyKey = getHistoryKey(sessionId);
    const history = (await CacheUtil.get<ChatMessage[]>(historyKey)) || [];

    // ── Layer 0: FAQ — static answers for policy/info questions ──
    if (aiConfig.faqEnabled) {
      const faqMatch = matchFAQ(userMessage, history);
      if (faqMatch) {
        history.push({ role: "user", content: userMessage });
        history.push({ role: "assistant", content: faqMatch.answer });
        await CacheUtil.set(historyKey, history, aiConfig.historyTTL);
        console.log(`[Chatbot] FAQ_HIT | question="${userMessage}" | type=${faqMatch.questionType}`);
        return { reply: faqMatch.answer };
      }
    }

    // ── Layer 1: Dedup — coalesce concurrent identical questions ──
    const dedupKey = normalizeChatQuestion(userMessage);
    const isDedup = requestDedup.has(dedupKey);

    const result = await requestDedup.dedup(dedupKey, async () => {
      // ── DB knowledge cache lookup — disabled: every question calls Gemini directly ──
      // const isSelfContained = isSelfContainedQuestion(userMessage);
      // const contextSensitive = hasActiveTopicContext(history) && isShortFollowUp(userMessage);
      // if (isSelfContained && !contextSensitive) {
      //   try {
      //     const cached = await this.knowledgeRepo.findSimilar(userMessage);
      //     if (cached) {
      //       await this.knowledgeRepo.incrementHitCount(cached.id);
      //       console.log(`[Chatbot] DB_HIT | question="${userMessage}" | hitCount=${cached.hitCount + 1} | geminiReqs=0`);
      //       return { reply: cached.answer };
      //     }
      //   } catch { /* DB error — continue */ }
      // }

      // ── Embedding similarity cache lookup — disabled ──
      // let queryEmbedding: number[] | null = null;
      // queryEmbedding = await generateEmbedding(normalizeChatQuestion(userMessage));
      // if (queryEmbedding) {
      //   try {
      //     const embeddingMatch = await this.knowledgeRepo.findByEmbedding(queryEmbedding);
      //     if (embeddingMatch) {
      //       await this.knowledgeRepo.incrementHitCount(embeddingMatch.id);
      //       console.log(`[Chatbot] EMBEDDING_HIT | question="${userMessage}" | matched="${embeddingMatch.question}" | geminiReqs=0`);
      //       return { reply: embeddingMatch.answer };
      //     }
      //   } catch { /* Embedding search error — continue */ }
      // }

      // Build a local copy of messages for Gemini context (does NOT mutate session history)
      const geminiMessages: ChatMessage[] = [...history, { role: "user" as const, content: userMessage }];

      // Trim to max history, ensuring first message is always 'user' (Gemini requirement)
      while (geminiMessages.length > aiConfig.maxHistoryMessages) {
        geminiMessages.shift();
      }
      while (geminiMessages.length > 0 && geminiMessages[0].role !== 'user') {
        geminiMessages.shift();
      }

      // Call AI with tool use loop
      let geminiReqs = 0;
      let response;
      try {
        response = await this.adapter.chat({
          systemPrompt: SYSTEM_PROMPT,
          messages: geminiMessages,
          tools: TOOL_DEFINITIONS,
        });
        geminiReqs++;
      } catch (err: any) {
        console.error(`[Chatbot] Gemini chat error: ${err?.message || err}`);
        const reply = err instanceof GeminiAllModelsExhaustedError
          ? 'Dạ hệ thống AI đang quá tải tạm thời. Anh/chị vui lòng thử lại sau khoảng 30 giây, hoặc nhắn trực tiếp Zalo 0347.366.345 để mình hỗ trợ ngay nhé!'
          : 'Xin lỗi, hệ thống đang tìm kiếm thông tin. Vui lòng thử lại sau hoặc liên hệ hotline 0347.366.345.';
        return { reply };
      }

      let escalated = false;
      let hasError = false;
      let loopCount = 0;
      const executedTools: { name: string; args: Record<string, unknown>; result: Record<string, unknown> }[] = [];

      // Tool use loop: execute tools and continue until we get a text response
      while (response.toolCalls.length > 0 && loopCount < aiConfig.maxToolCalls) {
        loopCount++;

        const toolResults = await Promise.all(
          response.toolCalls.map(async (tc) => {
            try {
              const result = await this.toolsService.executeTool(
                tc.name,
                tc.args,
                sessionId,
                clientUrl,
              );
              if (tc.name === "escalate_to_human") escalated = true;
              // Auto-link Customer when phone lookup succeeds
              if (tc.name === 'lookup_customer_by_phone') {
                const r = result as Record<string, unknown>;
                const cust = r?.customer as Record<string, unknown> | undefined;
                if (r?.found && cust?.id) {
                  this.chatbotRepo.linkCustomer(sessionId, cust.id as string).catch(() => {});
                }
              }
              executedTools.push({ name: tc.name, args: tc.args, result: result as Record<string, unknown> });
              return result as Record<string, unknown>;
            } catch {
              return { error: "Lỗi khi thực thi công cụ" } as Record<
                string,
                unknown
              >;
            }
          }),
        );

        // Save executed tool names + results into geminiMessages for AI memory
        const executedCalls = response.toolCalls;
        geminiMessages.push({
          role: "assistant",
          content: executedCalls.map((tc, i) =>
            `[${tc.name}] → ${JSON.stringify(toolResults[i]).slice(0, 800)}`
          ).join('\n'),
        });

        // Continue conversation with tool results
        try {
          response = await this.adapter.continueWithToolResults({
            systemPrompt: SYSTEM_PROMPT,
            messages: geminiMessages,
            tools: TOOL_DEFINITIONS,
            toolCalls: executedCalls,
            toolResults,
          });
          geminiReqs++;
        } catch {
          hasError = true;
          // Fallback: compose reply directly from tool results
          const reply = toolResults.map((r: any) => {
            if (r?.replyDraft) return r.replyDraft;
            if (r?.products) return r.products.map((p: any) => {
              const price = Number(p.sellingPrice ?? p.price ?? 0).toLocaleString('vi-VN');
              const link = p.productUrl ? ` — ${p.productUrl}` : '';
              return `• ${p.name} — ${price}đ${link}`;
            }).join('\n');
            if (r?.found === false) return r.message || 'Không tìm thấy khách hàng.';
            if (r?.found && r?.customer) return `Khách hàng: ${r.customer.name} (${r.customer.phone})`;
            if (r?.error) return r.error;
            return '';
          }).filter(Boolean).join('\n');
          response = { text: reply || 'Xin lỗi, mình gặp lỗi khi xử lý. Vui lòng thử lại.', toolCalls: [] };
          break;
        }
      }

      let replyText = response.text || (() => {
        hasError = true;
        return "Xin lỗi, mình chưa thể xử lý yêu cầu này. Anh/chị vui lòng liên hệ hotline 0347.366.345 để được hỗ trợ nhé!";
      })();

      // Safety net: guarantee product links appear even when Gemini forgets.
      // Pulls URLs from tool results (get_product_detail.productUrl,
      // search_products.products[].productUrl) and appends any that the reply
      // doesn't already mention. Deduped by URL.
      //
      // EXCEPT when the reply is an order-confirmation CTA ("/confirm/<token>"
      // link rendered as a button). The confirmation button is the primary
      // action — extra product links below would clutter the CTA.
      const isOrderConfirmation =
        executedTools.some((t) => t.name === 'create_order_confirmation') ||
        replyText.includes('/confirm/');

      if (!hasError && !isOrderConfirmation) {
        const urlEntries: { name: string; url: string }[] = [];
        const seenUrls = new Set<string>();
        for (const t of executedTools) {
          const r = t.result as any;
          const candidates: { name?: string; url?: string }[] = [];
          if (r?.productUrl) candidates.push({ name: r?.name, url: r.productUrl });
          if (Array.isArray(r?.products)) {
            for (const p of r.products) {
              if (p?.productUrl) candidates.push({ name: p?.name, url: p.productUrl });
            }
          }
          for (const c of candidates) {
            if (c.url && !seenUrls.has(c.url)) {
              seenUrls.add(c.url);
              urlEntries.push({ name: c.name || 'Sản phẩm', url: c.url });
            }
          }
        }
        const missing = urlEntries.filter((e) => !replyText.includes(e.url));
        if (missing.length === 1) {
          replyText += `\n\n👉 Xem chi tiết: ${missing[0].url}`;
        } else if (missing.length > 1) {
          replyText +=
            '\n\n👉 Xem chi tiết:\n' +
            missing.map((e) => `• ${e.name}: ${e.url}`).join('\n');
        }
      }

      const toolNames = executedTools.map((t) => t.name).join(', ') || 'none';
      console.log(`[Chatbot] GEMINI | question="${userMessage}" | geminiReqs=${geminiReqs} | tools=[${toolNames}]`);

      // ── Save to DB knowledge cache — disabled: answers are not cached, Gemini is called each time ──
      // if (isSelfContained && !contextSensitive && !escalated && !hasError && executedTools.length > 0) {
      //   const firstTool = executedTools[0];
      //   if (!SKIP_CACHE_TOOLS.has(firstTool.name)) {
      //     const questionType = TOOL_TYPE_MAP[firstTool.name] || ChatQuestionType.GENERAL;
      //     const hours = EXPIRY_HOURS[questionType];
      //     const expiresAt = new Date(Date.now() + hours * 3600_000);
      //     const productIds = executedTools.flatMap((t) => {
      //       const res = t.result as any;
      //       if (res?.products) return res.products.map((p: any) => p.id).filter(Boolean);
      //       if (res?.id) return [res.id];
      //       return [];
      //     });
      //     const saveEmbedding = await generateEmbedding(normalizeChatQuestion(userMessage));
      //     this.knowledgeRepo.save({
      //       question: userMessage,
      //       answer: replyText,
      //       questionType,
      //       toolName: firstTool.name,
      //       toolArgs: firstTool.args,
      //       productIds: productIds.length > 0 ? productIds : undefined,
      //       embedding: saveEmbedding ?? undefined,
      //       expiresAt,
      //     }).catch(() => {});
      //   }
      // }

      return { reply: replyText, escalated, executedTools };
    });

    if (isDedup) {
      console.log(`[Chatbot] DEDUP_HIT | question="${userMessage}" | key="${dedupKey}"`);
    }

    // Save to session history (OUTSIDE dedup — every session gets its own history)
    // Tool results are merged into the assistant message so follow-up messages
    // retain product IDs and search context (e.g. "xem chi tiết" after a search).
    history.push({ role: "user", content: userMessage });
    const toolContext = (result.executedTools ?? [])
      .filter((t) => !SKIP_CACHE_TOOLS.has(t.name))
      .map((t) => `[${t.name}] → ${JSON.stringify(t.result).slice(0, 500)}`)
      .join('\n');
    const assistantContent = toolContext
      ? `${toolContext}\n\n${result.reply}`
      : result.reply;
    history.push({ role: "assistant", content: assistantContent });
    await CacheUtil.set(historyKey, history, aiConfig.historyTTL);

    // Persist to DB (fire-and-forget — never block response)
    this.chatbotRepo.findOrCreateSession(sessionId)
      .then((session) => this.chatbotRepo.saveMessages(session.id, userMessage, result.reply))
      .catch(() => {});

    return result;
  }

  /**
   * Get conversation history for a session.
   * Falls back to DB when Redis cache has expired.
   */
  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const cached = await CacheUtil.get<ChatMessage[]>(getHistoryKey(sessionId));
    if (cached && cached.length > 0) return cached;

    // Fallback: load from DB and re-populate Redis
    try {
      const dbMessages = await this.chatbotRepo.getMessagesByClientId(sessionId);
      if (dbMessages.length > 0) {
        const history: ChatMessage[] = dbMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        await CacheUtil.set(getHistoryKey(sessionId), history, aiConfig.historyTTL);
        return history;
      }
    } catch {
      // DB error — return empty, don't block
    }
    return [];
  }

  /**
   * Clear conversation history.
   */
  async clearHistory(sessionId: string): Promise<void> {
    await CacheUtil.del(getHistoryKey(sessionId));
  }

  /**
   * Clear all cached knowledge (ChatKnowledge DB + Redis search cache).
   * Use after fixing search logic to purge stale/wrong cached answers.
   */
  async clearKnowledge(): Promise<{ dbCleared: number; redisCleared: number }> {
    // Invalidate all active DB knowledge entries
    const dbResult = await this.knowledgeRepo.invalidateByType(ChatQuestionType.PRODUCT_INQUIRY);
    const dbResult2 = await this.knowledgeRepo.invalidateByType(ChatQuestionType.GENERAL);

    // Clear Redis caches for search, product detail, promos, and categories
    // (all hold LLM-input shapes that can become stale after code changes).
    const redis = (await import("../../config/redis")).default;
    const patterns = ['chatbot:search:*', 'chatbot:detail:*', 'chatbot:promos:*', 'chatbot:categories'];
    let redisCleared = 0;
    for (const pat of patterns) {
      const keys = await redis.keys(pat);
      if (keys.length > 0) redisCleared += await redis.del(...keys);
    }

    return { dbCleared: dbResult + dbResult2, redisCleared };
  }
}
