/**
 * Single source of truth for the JWT signing / verification secret.
 *
 * Production requires an explicit, strong secret (≥32 characters). Development
 * falls back to a clearly-marked insecure default so `npm run dev` works out
 * of the box — a one-time warning is printed instead of silently failing.
 */

const DEV_FALLBACK_SECRET = 'pathonexa-development-only-secret-change-in-production';

let warned = false;

function authSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw Object.assign(new Error('Server authentication is not configured'), { status: 503 });
    }
    if (!warned) {
      warned = true;
      console.warn(
        '[auth] JWT_SECRET is not set; using an insecure development fallback. '
        + 'Set a strong JWT_SECRET before deploying.',
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw Object.assign(new Error('Server authentication is not configured'), { status: 503 });
  }
  return secret;
}

module.exports = { authSecret };
