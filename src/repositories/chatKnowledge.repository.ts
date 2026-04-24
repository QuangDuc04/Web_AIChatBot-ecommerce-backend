import { Repository, LessThan, In, Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ChatKnowledge, ChatQuestionType } from '../entities/ChatKnowledge';
import { analyzeSearchQuery, escapeLike, normalizeChatQuestion } from '../utils/search-query.util';
import { cosineSimilarity } from '../services/ai/embedding.service';

/** Minimum relevance score to consider a cache hit */
const MIN_SCORE = 40;

/** Minimum ratio of query words that must match the cached question */
const MIN_MATCH_RATIO = 0.7;

export class ChatKnowledgeRepository {
  private repo: Repository<ChatKnowledge>;

  constructor() {
    this.repo = AppDataSource.getRepository(ChatKnowledge);
  }

  /**
   * Find a similar cached question using scored LIKE matching.
   *
   * Scoring signals (on ck.question):
   *   - Phrase matches (longer = heavier)
   *   - Individual word matches (handles short Vietnamese words like "in")
   *   - Model variant matches
   *
   * Filters:
   *   - At least 70% of query words must appear in the cached question
   *   - Minimum score of 40 (at least one 2-word phrase must match)
   *   - Post-SQL reverse check: cached question words must also mostly appear in the query
   */
  async findSimilar(question: string): Promise<ChatKnowledge | null> {
    // Normalize to strip conversational prefixes/suffixes
    // "tôi muốn mua giấy K80" → "giấy k80"
    const normalized = normalizeChatQuestion(question);
    const analyzed = analyzeSearchQuery(normalized);
    if (analyzed.words.length === 0) return null;

    const qb = this.repo.createQueryBuilder('ck');

    const scoreTerms: string[] = [];
    const matchCounts: string[] = [];
    const params: Record<string, unknown> = {};
    let idx = 0;

    // ── Phrase matches on ck.question ──
    for (const phrase of analyzed.phrases) {
      const k = `p${idx++}`;
      const weight = phrase.split(/\s+/).length * 20;
      scoreTerms.push(`(CASE WHEN ck.question LIKE :${k} THEN ${weight} ELSE 0 END)`);
      params[k] = `%${escapeLike(phrase)}%`;
    }

    // ── Individual word matches ──
    for (const w of analyzed.words) {
      const k = `w${idx++}`;
      scoreTerms.push(`(CASE WHEN ck.question LIKE :${k} THEN 10 ELSE 0 END)`);
      matchCounts.push(`(CASE WHEN ck.question LIKE :${k} THEN 1 ELSE 0 END)`);
      params[k] = `%${escapeLike(w)}%`;
    }

    // ── Model variant matches ──
    for (const v of analyzed.modelVariants) {
      const k = `v${idx++}`;
      scoreTerms.push(`(CASE WHEN ck.question LIKE :${k} THEN 15 ELSE 0 END)`);
      params[k] = `%${escapeLike(v)}%`;
    }

    const scoreExpr = scoreTerms.join(' + ');
    const matchCountExpr = matchCounts.join(' + ');
    const minMatchCount = Math.max(1, Math.ceil(analyzed.words.length * MIN_MATCH_RATIO));

    qb.addSelect(`(${scoreExpr})`, 'relevance');
    qb.where('ck.isActive = true');
    qb.andWhere('ck.expiresAt > NOW()');
    // At least X% of query words must appear in the cached question
    qb.andWhere(`(${matchCountExpr}) >= :minMatch`);
    qb.setParameter('minMatch', minMatchCount);
    qb.setParameters(params);
    qb.orderBy('relevance', 'DESC');
    qb.limit(1);

    const result = await qb.getRawAndEntities();
    if (result.entities.length === 0) return null;

    const score = Number(result.raw[0]?.relevance ?? 0);
    if (score < MIN_SCORE) return null;

    // ── Reverse check (JS): cached question's core words must mostly appear in query ──
    // Both sides are normalized so "tôi muốn mua" / "cho mình tìm" are stripped.
    // Prevents "giấy in" from matching cached "giấy in bill k80x80"
    const cached = result.entities[0];
    const cachedNormalized = normalizeChatQuestion(cached.question);
    const cachedAnalyzed = analyzeSearchQuery(cachedNormalized);

    const queryWordsLower = new Set(analyzed.words.map((w) => w.toLowerCase()));
    for (const v of analyzed.modelVariants) queryWordsLower.add(v.toLowerCase());

    const cachedMatchCount = cachedAnalyzed.words.filter(
      (w) => queryWordsLower.has(w.toLowerCase()),
    ).length;
    const cachedMatchRatio = cachedMatchCount / Math.max(cachedAnalyzed.words.length, 1);

    if (cachedMatchRatio < MIN_MATCH_RATIO) return null;

    // ── Model number cross-check ──
    // If either side has model numbers, they must overlap.
    // Prevents "chi tiết giấy K80" from matching cached "chi tiết tem 40x30"
    const queryModels = new Set([
      ...analyzed.modelNumbers.map((m) => m.toLowerCase()),
      ...analyzed.modelVariants.map((v) => v.toLowerCase()),
    ]);
    const cachedModels = new Set([
      ...cachedAnalyzed.modelNumbers.map((m) => m.toLowerCase()),
      ...cachedAnalyzed.modelVariants.map((v) => v.toLowerCase()),
    ]);

    if (queryModels.size > 0 && cachedModels.size > 0) {
      // Both have model numbers → at least one must overlap
      const overlap = [...queryModels].some((m) => cachedModels.has(m));
      if (!overlap) return null;
    } else if (queryModels.size > 0 || cachedModels.size > 0) {
      // Only one side has model numbers → different product intent
      return null;
    }

    return cached;
  }

  /**
   * Find a semantically similar cached question using embedding cosine similarity.
   *
   * Loads all active, non-expired entries that have embeddings,
   * computes cosine similarity in JS, returns the best match above threshold.
   *
   * Designed for small datasets (< 1000 active entries) — no vector DB needed.
   */
  async findByEmbedding(
    queryEmbedding: number[],
    threshold = 0.82,
  ): Promise<ChatKnowledge | null> {
    const entries = await this.repo.find({
      where: { isActive: true },
      select: ['id', 'question', 'answer', 'questionType', 'hitCount', 'embedding', 'expiresAt'],
    });

    let bestMatch: ChatKnowledge | null = null;
    let bestScore = threshold;

    for (const entry of entries) {
      if (!entry.embedding || entry.expiresAt < new Date()) continue;
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      console.log(`[Chatbot] EMBEDDING_HIT | question="${bestMatch.question}" | score=${bestScore.toFixed(4)}`);
    }

    return bestMatch;
  }

  /**
   * Save a new Q&A entry.
   */
  async save(data: {
    question: string;
    answer: string;
    questionType: ChatQuestionType;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    productIds?: string[];
    embedding?: number[];
    expiresAt: Date;
  }): Promise<ChatKnowledge> {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  /**
   * Increment hit count when a cached answer is reused.
   */
  async incrementHitCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'hitCount', 1);
  }

  /**
   * Invalidate all entries related to specific product IDs.
   */
  async invalidateByProductIds(productIds: string[]): Promise<number> {
    if (productIds.length === 0) return 0;

    // JSON_OVERLAPS checks if productIds array overlaps with given IDs
    const result = await this.repo
      .createQueryBuilder()
      .update(ChatKnowledge)
      .set({ isActive: false })
      .where('isActive = true')
      .andWhere(
        productIds
          .map((_, i) => `JSON_CONTAINS(productIds, :pid${i})`)
          .join(' OR '),
        Object.fromEntries(productIds.map((pid, i) => [`pid${i}`, JSON.stringify(pid)])),
      )
      .execute();

    return result.affected || 0;
  }

  /**
   * Invalidate all entries of a specific question type.
   */
  async invalidateByType(questionType: ChatQuestionType): Promise<number> {
    const result = await this.repo.update(
      { questionType, isActive: true },
      { isActive: false },
    );
    return result.affected || 0;
  }

  /**
   * Cleanup: remove expired or stale entries.
   */
  async cleanup(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(ChatKnowledge)
      .where('expiresAt < NOW()')
      .orWhere('isActive = false AND updatedAt < DATE_SUB(NOW(), INTERVAL 1 DAY)')
      .execute();
    return result.affected || 0;
  }
}
