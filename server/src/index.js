const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, startDB, isReady, mode, retrying } = require('./config/db');
const { requireAuth } = require('./middleware/auth');
// Register models/store before database index synchronization starts.
require('./lib/store');

const app = express();

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true); // native apps and server-to-server clients
  const configured = String(process.env.CORS_ORIGINS || '')
    .split(',').map((item) => item.trim()).filter(Boolean);
  if (configured.includes(origin)) return callback(null, true);
  if (process.env.NODE_ENV !== 'production') {
    try {
      const url = new URL(origin);
      if (['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname) || url.hostname.endsWith('.e2b.app')) {
        return callback(null, true);
      }
    } catch { /* rejected below */ }
  }
  return callback(Object.assign(new Error('Origin is not allowed'), { status: 403 }));
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(cors({ origin: corsOrigin, credentials: false, allowedHeaders: ['Authorization', 'Content-Type'] }));
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logging: every incoming request is written to the server logs with
// a timestamp, method, path, status and response time so traffic is always
// visible while developing.
if (process.env.NODE_ENV !== 'test') {
  morgan.token('iso', () => new Date().toISOString());
  app.use(morgan('[:iso] :method :url :status :res[content-length] - :response-time ms'));
}

// Development-only request-body logging (helps debug login / OTP payloads).
// Kept out of production so sensitive bodies are never written to prod logs.
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length
      && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      let preview = JSON.stringify(req.body);
      if (preview.length > 500) preview = `${preview.slice(0, 500)}…`;
      console.log(`[request] ${req.method} ${req.originalUrl} body=${preview}`);
    }
    next();
  });
}

app.get('/api/health', (req, res) => {
  const dbMode = mode();
  const available = isReady() || dbMode === 'memory';
  res.status(available ? 200 : 503).json({
    status: available ? 'ok' : 'unavailable',
    message: available ? 'PathoNexa API is running' : 'Persistent database is unavailable',
    db: dbMode,
    persistent: isReady(),
    retrying: retrying(),
    time: new Date().toISOString(),
  });
});

// OTP request/verification are the only unauthenticated business endpoints.
app.use('/api/auth', require('./routes/authRoutes'));

// Every route below this point has a verified account and AsyncLocalStorage
// tenant context. Store and model layers additionally enforce that owner.
app.use('/api', requireAuth);
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api', require('./routes/moduleRoutes'));
app.use('/api', require('./routes/metaRoutes'));

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const duplicate = err?.code === 11000;
  const validation = err?.name === 'ValidationError' || err?.name === 'CastError';
  const status = duplicate ? 409 : validation ? 400 : (err.status || 500);
  if (status >= 500) console.error('API Error:', err.message);
  res.status(status).json({
    message: duplicate ? 'A record with these details already exists' : validation ? 'Invalid request data' : (err.message || 'Something went wrong'),
  });
});

const PORT = Number(process.env.PORT) || 5000;
let listenerPromise = null;
if (require.main === module) {
  // Listen independently of MongoDB so nodemon/container health checks keep
  // working during temporary Atlas/network outages. Health and every business
  // operation remain fail-closed until the required persistence is ready.
  const listener = app.listen(PORT, '0.0.0.0');
  listenerPromise = new Promise((resolve, reject) => {
    listener.once('listening', () => {
      console.log(`[server] PathoNexa API listening on http://localhost:${PORT} (${mode()} mode)`);
      resolve(listener);
    });
    listener.once('error', reject);
  });
  listenerPromise.catch((error) => {
    console.error(`[server] HTTP listener failed: ${error.message}`);
    process.exitCode = 1;
  });
  startDB().catch(() => {
    const detail = process.env.MONGODB_URI?.trim()
      ? 'automatic MongoDB retry is active.'
      : 'configure MONGODB_URI and restart the process.';
    console.warn(`[server] API is listening in database-wait mode; ${detail}`);
  });
} else {
  // Serverless handlers await readiness through requireAuth/store methods.
  connectDB().catch(() => {});
}

module.exports = app;
module.exports.listenerPromise = listenerPromise;
