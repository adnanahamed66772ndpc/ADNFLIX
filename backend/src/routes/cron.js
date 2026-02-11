const express = require('express');
const { expireSubscriptions } = require('../controllers/cronController.js');

const router = express.Router();

function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({
      error: 'Cron not configured',
      message: 'Set CRON_SECRET in .env to enable subscription expiry cron.'
    });
  }
  const provided = req.headers['x-cron-secret'] || req.query.secret;
  if (provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/expire-subscriptions', requireCronSecret, expireSubscriptions);
router.post('/expire-subscriptions', requireCronSecret, expireSubscriptions);

module.exports = router;
