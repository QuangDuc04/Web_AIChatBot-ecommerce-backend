import redis from '../config/redis';

async function main() {
  const patterns = [
    'chatbot:search:*',
    'chatbot:detail:*',
    'chatbot:promos:*',
    'chatbot:categories',
    'chatbot:history:*',
    'chatbot:ratelimit:*',
    'chatbot:orders:*',
    'rl:chatbot:*',
  ];

  let total = 0;
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      console.log(`  ${pattern.padEnd(30)} → 0 keys`);
      continue;
    }
    const deleted = await redis.del(...keys);
    total += deleted;
    console.log(`  ${pattern.padEnd(30)} → ${deleted} keys deleted`);
  }
  console.log(`\nTotal: ${total} keys cleared.`);
  await redis.quit();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
