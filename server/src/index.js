const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, isReady } = require('./config/db');
const store = require('./lib/store');

const app = express();

// Connect to MongoDB (falls back to the in-memory store when unreachable).
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Health check — the app pings this to show the server connection status.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'PathoNexa API is running',
    db: isReady() ? 'mongodb' : 'memory',
    time: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// Module routes (ledger, commissions, analytics, subscription, backup, …)
// are mounted before the generic master-data CRUD so their nested paths win.
app.use('/api', require('./routes/moduleRoutes'));
app.use('/api', require('./routes/metaRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong!',
    // Only leak stack traces for unexpected server errors in development.
    error: status >= 500 && process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  // 0.0.0.0 so the app can reach the server from Android emulators / LAN devices.
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] PathoNexa API running on http://localhost:${PORT} (${isReady() ? 'MongoDB' : 'in-memory'} mode)`);
    console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel
module.exports = app;
