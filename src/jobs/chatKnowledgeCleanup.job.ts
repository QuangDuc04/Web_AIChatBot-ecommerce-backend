import { ChatKnowledgeRepository } from '../repositories/chatKnowledge.repository';

const INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours

export function startChatKnowledgeCleanupJob() {
  const repo = new ChatKnowledgeRepository();

  const run = async () => {
    try {
      const count = await repo.cleanup();
      if (count > 0) {
        console.log(`[ChatKnowledgeCleanup] Removed ${count} expired entries`);
      }
    } catch (err) {
      console.error('[ChatKnowledgeCleanup] Error:', err);
    }
  };

  run();
  setInterval(run, INTERVAL_MS);
  console.log('[ChatKnowledgeCleanup] Started (every 6 hours)');
}
