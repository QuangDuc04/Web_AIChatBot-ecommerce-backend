import { OrderConfirmationService } from '../services/orderConfirmation.service';

const INTERVAL_MS = 5 * 60 * 1000; // Run every 5 minutes

/**
 * Periodically marks expired order confirmations and creates admin notifications.
 * Call startExpiredConfirmationJob() once after DB is connected.
 */
export function startExpiredConfirmationJob() {
  const service = new OrderConfirmationService();

  const run = async () => {
    try {
      const count = await service.handleExpired();
      if (count > 0) {
        console.log(`[ExpiredConfirmationJob] Marked ${count} confirmation(s) as expired`);
      }
    } catch (err) {
      console.error('[ExpiredConfirmationJob] Error:', err);
    }
  };

  // Run immediately on startup, then every 5 minutes
  run();
  setInterval(run, INTERVAL_MS);

  console.log('[ExpiredConfirmationJob] Started (every 5 minutes)');
}
