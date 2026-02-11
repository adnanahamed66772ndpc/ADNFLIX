const pool = require('../config/database.js');

/**
 * Expire subscriptions: set plan to 'free' for users whose subscription_expires_at has passed.
 * Call this daily via cron (e.g. GET /api/cron/expire-subscriptions with X-Cron-Secret header).
 */
async function expireSubscriptions(req, res, next) {
  try {
    const [result] = await pool.execute(
      `UPDATE profiles SET
        subscription_plan = 'free',
        subscription_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
       WHERE subscription_expires_at IS NOT NULL
         AND subscription_expires_at < CURRENT_TIMESTAMP`
    );

    res.json({
      success: true,
      expiredCount: result.affectedRows,
      message: `${result.affectedRows} subscription(s) downgraded to free.`
    });
  } catch (error) {
    console.error('expireSubscriptions error:', error);
    next(error);
  }
}

module.exports = { expireSubscriptions };
