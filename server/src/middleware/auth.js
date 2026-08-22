const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/db');
const { runWithTenant } = require('../lib/tenantContext');

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || (process.env.NODE_ENV === 'production' && secret.length < 32)) {
    throw Object.assign(new Error('Server authentication is not configured'), { status: 503 });
  }
  return secret;
}

function bearerToken(header = '') {
  const match = /^Bearer\s+([^\s]+)$/i.exec(String(header));
  return match?.[1] || '';
}

async function requireAuth(req, res, next) {
  try {
    await db.whenReady();
    const token = bearerToken(req.headers.authorization);
    if (!token) throw Object.assign(new Error('Authentication required'), { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret(), {
        algorithms: ['HS256'],
        issuer: 'pathonexa-api',
        audience: 'pathonexa-app',
      });
    } catch {
      throw Object.assign(new Error('Invalid or expired session'), { status: 401 });
    }

    const id = String(decoded.sub || decoded.id || '');
    if (!id) throw Object.assign(new Error('Invalid or expired session'), { status: 401 });

    // Reject deleted accounts and tokens whose account identity no longer
    // matches. The in-memory development adapter validates through the store.
    let user;
    if (db.isReady()) user = await User.findById(id).lean();
    else {
      // Delayed require avoids a store ↔ middleware initialization cycle.
      user = await require('../lib/store').auth.findUser(id);
    }
    if (!user) throw Object.assign(new Error('Invalid or expired session'), { status: 401 });

    const auth = { id, mobile: user.mobile, name: user.name, role: user.role };
    req.auth = auth;
    runWithTenant(auth, next);
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth, jwtSecret };
