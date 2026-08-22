/**
 * Razorpay integration — order creation and payment-signature verification.
 *
 * Uses Razorpay's REST API directly (no native SDK) so it works with the
 * minimal Node runtime. The key secret stays server-side; only the publishable
 * key id is ever shared with the app (via GET /api/config).
 */
const crypto = require('crypto');

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

function configured() {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

function keyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() || '';
}

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!id || !secret) {
    throw Object.assign(new Error('Online payments are not configured'), { status: 503 });
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

/**
 * Create a Razorpay order for `amount` paise.
 * Returns the Razorpay order object ({ id, amount, currency, receipt, … }).
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const response = await fetch(`${RAZORPAY_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.description || body?.error?.reason || 'Unable to create the payment order';
    const err = Object.assign(new Error(message), { status: 502 });
    err.razorpay = body?.error || null;
    throw err;
  }
  return body;
}

/** Fetch an order by id (used to confirm amount + status during verification). */
async function fetchOrder(orderId) {
  const response = await fetch(`${RAZORPAY_BASE}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: authHeader() },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.description || 'Unable to look up the payment order';
    throw Object.assign(new Error(message), { status: 502 });
  }
  return body;
}

/** Fetch a payment by id (used to confirm the payment was captured). */
async function fetchPayment(paymentId) {
  const response = await fetch(`${RAZORPAY_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.description || 'Unable to look up the payment';
    throw Object.assign(new Error(message), { status: 502 });
  }
  return body;
}

/**
 * Verify a Razorpay checkout signature: HMAC-SHA256 of `${orderId}|${paymentId}`
 * signed with the key secret, compared in constant time.
 */
function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const supplied = String(signature || '');
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(supplied, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { configured, keyId, createOrder, fetchOrder, fetchPayment, verifySignature };
