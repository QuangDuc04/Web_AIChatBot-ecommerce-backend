import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig } from '../../config/ai.config';

const genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: aiConfig.gemini.embeddingModel });

/**
 * Generate an embedding vector for the given text using the configured Gemini embedding model.
 * Default model `gemini-embedding-001` returns 3072-dim vectors; legacy `text-embedding-004` returns 768-dim.
 * Returns a float array or null if the API call fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.warn('[Embedding] Failed to generate embedding:', (err as Error).message);
    return null;
  }
}

/**
 * Compute cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}
