import dotenv from 'dotenv';
dotenv.config();

const parseFallbackModels = (raw?: string): string[] =>
  (raw || 'gemini-2.5-flash-lite,gemini-2.0-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

export const aiConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    /**
     * Models tried in order when the primary returns 503/429.
     * Each model gets its own retry budget before we move to the next.
     */
    fallbackModels: parseFallbackModels(process.env.GEMINI_FALLBACK_MODELS),
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    /** Retry delays (ms) per attempt for a single model. Short so users don't wait long. */
    retryDelaysMs: [2000, 5000],
  },
  /** Max tool calls per single user message (prevent infinite loop).
   *  Comparison queries can need 2×search + 2×get_detail = 4 iterations. */
  maxToolCalls: 5,
  /** Conversation history TTL in Redis (seconds) */
  historyTTL: 7200, // 2h
  /** Max messages kept in history */
  maxHistoryMessages: 15,
  /** Rate limit: max messages per minute per session */
  rateLimitPerMinute: 10,
  /** When true, FAQ matcher intercepts common policy questions before Gemini */
  faqEnabled: true,
};
