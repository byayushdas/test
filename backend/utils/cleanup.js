const prisma = require('./prisma');

function startNotificationCleanup() {
  // The original MongoDB model used a TTL index: expires: 18000 (5 hours)
  // We run this cleanup every hour to purge notifications older than 5 hours
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const EXPIRY_MS = 5 * 60 * 60 * 1000; // 5 hours

  setInterval(async () => {
    try {
      const fiveHoursAgo = new Date(Date.now() - EXPIRY_MS);
      
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: fiveHoursAgo
          }
        }
      });

      if (result.count > 0) {
        console.log(`[Cron] Cleaned up ${result.count} expired notifications.`);
      }
    } catch (error) {
      console.error('[Cron] Error cleaning up notifications:', error);
    }
  }, INTERVAL_MS);
}

module.exports = { startNotificationCleanup };
