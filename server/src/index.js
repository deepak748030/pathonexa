const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, isReady, mode } = require('./config/db');
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
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await require('./config/db').whenReady();
    res.status(200).json({
      status: 'ok',
      message: 'PathoNexa API is running',
      db: mode(),
      persistent: isReady(),
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: 'unavailable', message: 'Persistent database is unavailable' });
  }
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
  listenerPromise = connectDB()
    .then(() => app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] PathoNexa API running on http://localhost:${PORT} (${mode()} mode)`);
    }))
    .catch((error) => {
      console.error(`[server] Startup aborted: ${error.message}`);
      process.exitCode = 1;
    });
} else {
  // Serverless handlers await readiness through requireAuth/health.
  connectDB().catch(() => {});
}

module.exports = app;
module.exports.listenerPromise = listenerPromise;
