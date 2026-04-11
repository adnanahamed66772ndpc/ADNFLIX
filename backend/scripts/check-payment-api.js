#!/usr/bin/env node
/**
 * Verifies payment-methods API (backend).
 * Usage: node scripts/check-payment-api.js
 *        BASE_URL=https://yoursite.com node scripts/check-payment-api.js
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('Checking payment number API at', BASE, '\n');

  // 1) Public GET /api/config/payment-methods (no auth)
  try {
    const res = await fetch(`${BASE}/api/config/payment-methods`);
    const data = await res.json();
    if (!res.ok) {
      console.log('GET /api/config/payment-methods:', res.status, data);
      return;
    }
    console.log('GET /api/config/payment-methods:', res.status);
    if (Array.isArray(data)) {
      data.forEach((pm) => {
        console.log('  -', pm.id, '| name:', pm.name, '| number:', pm.number ?? '(empty)');
      });
    } else {
      console.log('  Response:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('GET /api/config/payment-methods failed:', e.message);
  }

  // 2) Full config (includes payment methods)
  try {
    const res = await fetch(`${BASE}/api/config`);
    const data = await res.json();
    if (!res.ok) {
      console.log('\nGET /api/config:', res.status, data);
      return;
    }
    console.log('\nGET /api/config:', res.status, '| paymentMethods count:', data.paymentMethods?.length ?? 0);
  } catch (e) {
    console.log('\nGET /api/config failed:', e.message);
  }
}

main();
