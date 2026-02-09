const express = require('express');

const router = express.Router();

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

// Payment Methods - Update numbers with real ones
const paymentMethods = [
  {
    id: 'bkash',
    name: 'bKash',
    logo: 'bkash',
    color: '#E2136E',
    number: '01XXXXXXXXX',
    instructions: [
      'Open bKash App or dial *247#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID'
    ]
  },
  {
    id: 'nagad',
    name: 'Nagad',
    logo: 'nagad',
    color: '#F6921E',
    number: '01XXXXXXXXX',
    instructions: [
      'Open Nagad App or dial *167#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID'
    ]
  },
  {
    id: 'rocket',
    name: 'Rocket',
    logo: 'rocket',
    color: '#8C3494',
    number: '01XXXXXXXXX',
    instructions: [
      'Open Rocket App or dial *322#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID'
    ]
  }
];

// Get subscription plans (public, no auth)
router.get('/plans', (req, res) => {
  res.status(200).json(subscriptionPlans);
});

// Get payment methods (public, no auth)
router.get('/payment-methods', (req, res) => {
  res.status(200).json(paymentMethods);
});

// Get all config in one call (public, no auth - for initial app load)
router.get('/', (req, res) => {
  res.status(200).json({
    plans: subscriptionPlans,
    paymentMethods: paymentMethods,
    appVersion: '1.0.0',
    minAppVersion: '1.0.0',
    maintenanceMode: false
  });
});

module.exports = router;
