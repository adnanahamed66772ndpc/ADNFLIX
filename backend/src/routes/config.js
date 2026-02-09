const express = require('express');
const pool = require('../config/database.js');

const router = express.Router();

// Static defaults for payment methods (logo, color, instructions)
const paymentMethodDefaults = {
  bkash: { logo: 'bkash', color: '#E2136E', instructions: ['Open bKash App or dial *247#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] },
  nagad: { logo: 'nagad', color: '#F6921E', instructions: ['Open Nagad App or dial *167#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] },
  rocket: { logo: 'rocket', color: '#8C3494', instructions: ['Open Rocket App or dial *322#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] }
};

async function getPaymentMethodsFromDb() {
  try {
    const [rows] = await pool.execute('SELECT id, name, number FROM payment_method_settings ORDER BY id');
    if (!rows || rows.length === 0) return null;
    return rows.map((r) => {
      const def = paymentMethodDefaults[r.id] || {};
      return {
        id: r.id,
        name: r.name,
        number: r.number || '01XXXXXXXXX',
        logo: def.logo,
        color: def.color,
        instructions: def.instructions || []
      };
    });
  } catch (_) {
    return null;
  }
}

// Subscription Plans - Static data for mobile apps
const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'BDT',
    interval: 'free',
    hasAds: false,
    features: [
      'Access to free content only',
      'Standard quality (480p)',
      'Watch on 1 device',
      'Limited library'
    ]
  },
  {
    id: 'with-ads',
    name: 'Basic (With Ads)',
    price: 99,
    currency: 'BDT',
    interval: 'monthly',
    hasAds: true,
    features: [
      'Access to all content',
      'HD quality (720p)',
      'Watch on 2 devices',
      'Contains advertisements',
      'Download for offline'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    currency: 'BDT',
    interval: 'monthly',
    hasAds: false,
    popular: true,
    features: [
      'Access to all content',
      'Ultra HD quality (4K)',
      'Watch on 4 devices',
      'No advertisements',
      'Download for offline',
      'Early access to new releases',
      'Exclusive content'
    ]
  }
];

// Fallback payment methods when DB is empty or fails
const paymentMethodsFallback = [
  { id: 'bkash', name: 'bKash', logo: 'bkash', color: '#E2136E', number: '01XXXXXXXXX', instructions: ['Open bKash App or dial *247#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] },
  { id: 'nagad', name: 'Nagad', logo: 'nagad', color: '#F6921E', number: '01XXXXXXXXX', instructions: ['Open Nagad App or dial *167#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] },
  { id: 'rocket', name: 'Rocket', logo: 'rocket', color: '#8C3494', number: '01XXXXXXXXX', instructions: ['Open Rocket App or dial *322#', 'Select "Send Money"', 'Enter the number', 'Enter the amount', 'Enter your PIN and confirm', 'Copy the Transaction ID'] }
];

// Get subscription plans (public, no auth)
router.get('/plans', (req, res) => {
  res.status(200).json(subscriptionPlans);
});

// Get payment methods (public, no auth) - from DB so website and app show admin-set numbers
router.get('/payment-methods', async (req, res) => {
  try {
    const methods = await getPaymentMethodsFromDb();
    res.status(200).json(methods && methods.length ? methods : paymentMethodsFallback);
  } catch (_) {
    res.status(200).json(paymentMethodsFallback);
  }
});

// Get all config in one call (public, no auth - for initial app load)
router.get('/', async (req, res) => {
  try {
    const paymentMethods = await getPaymentMethodsFromDb();
    res.status(200).json({
      plans: subscriptionPlans,
      paymentMethods: (paymentMethods && paymentMethods.length) ? paymentMethods : paymentMethodsFallback,
      appVersion: '1.0.0',
      minAppVersion: '1.0.0',
      maintenanceMode: false
    });
  } catch (_) {
    res.status(200).json({
      plans: subscriptionPlans,
      paymentMethods: paymentMethodsFallback,
      appVersion: '1.0.0',
      minAppVersion: '1.0.0',
      maintenanceMode: false
    });
  }
});

module.exports = router;
