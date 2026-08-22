const mongoose = require('mongoose');

// Never queue domain operations for an unavailable database. Readiness gates
// return 503, and a rare disconnect race fails immediately instead of silently
// buffering a write until some later reconnect.
mongoose.set('bufferCommands', false);

const state = {
  mode: 'connecting',
  ready: false,
  error: null,
  promise: null,
  retryEnabled: false,
  retryTimer: null,
  failures: 0,
  indexesReady: false,
};

function memoryAllowed() {
  // Persistence is mandatory unless an operator explicitly enables the
  // disposable adapter (or the isolated test suite is running).
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY === 'true';
}

function milliseconds(name, fallback, { min = 250, max = 120000 } = {}) {
  const supplied = Number(process.env[name]);
  if (!Number.isFinite(supplied) || supplied <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.floor(supplied)));
}

function connectionOptions() {
  const configuredFamily = Number(process.env.MONGODB_FAMILY);
  return {
    // Four seconds is too aggressive for Atlas DNS discovery and cold/free
    // clusters. Keep this configurable while using a practical default.
    serverSelectionTimeoutMS: milliseconds('MONGODB_TIMEOUT_MS', 15000),
    connectTimeoutMS: milliseconds('MONGODB_CONNECT_TIMEOUT_MS', 10000),
    socketTimeoutMS: milliseconds('MONGODB_SOCKET_TIMEOUT_MS', 45000, { min: 1000, max: 300000 }),
    family: [0, 4, 6].includes(configuredFamily) ? configuredFamily : 4,
    autoIndex: false,
  };
}

function safeErrorMessage(error) {
  return String(error?.message || 'Unknown MongoDB error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, '[redacted MongoDB URI]')
    .replace(/(\/\/)[^\s/@:]+:[^\s/@]+@/g, '$1[redacted]@')
    .slice(0, 800);
}

function connectionHint(error) {
  const message = String(error?.message || '');
  if (/authentication failed|bad auth|auth failed/i.test(message)) {
    return 'Check the MongoDB username/password and URL-encode special characters in the password.';
  }
  if (/ENOTFOUND|querySrv|DNS/i.test(message)) {
    return 'Check DNS/internet access and verify the mongodb+srv cluster hostname.';
  }
  if (/ECONNREFUSED|server selection timed out|ReplicaSetNoPrimary|MongoServerSelectionError/i.test(message)) {
    return 'For Atlas, check cluster status and Network Access/IP allowlisting; for local MongoDB, start the replica set and verify its host/port.';
  }
  if (/Invalid scheme|Invalid connection string|URI malformed/i.test(message)) {
    return 'MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string.';
  }
  if (/transaction numbers are only allowed|replica set member or mongos/i.test(message)) {
    return 'PathoNexa requires MongoDB Atlas or a local replica set because domain writes use transactions.';
  }
  return 'Check MONGODB_URI, MongoDB availability, transaction support, and the Atlas Network Access allowlist.';
}

async function syncApplicationIndexes() {
  // Models are registered by store.js before connectDB is called from index.js.
  // syncIndexes removes the old globally-unique pid/reportId indexes, installs
  // owner-scoped compound indexes, and enforces unique account/challenge keys.
  const names = ['User', 'OtpChallenge', 'Patient', 'Report', 'Meta', 'TenantCounter'];
  await Promise.all(names.filter((name) => mongoose.models[name]).map((name) => mongoose.models[name].syncIndexes()));
}

function clearRetryTimer() {
  if (!state.retryTimer) return;
  clearTimeout(state.retryTimer);
  state.retryTimer = null;
}

function retryDelay() {
  const base = milliseconds('MONGODB_RETRY_MS', 3000, { min: 250, max: 60000 });
  const maximum = milliseconds('MONGODB_RETRY_MAX_MS', Math.max(30000, base), { min: base, max: 300000 });
  return Math.min(maximum, base * (2 ** Math.min(Math.max(state.failures - 1, 0), 6)));
}

function scheduleRetry() {
  if (!state.retryEnabled || state.ready || state.retryTimer || memoryAllowed() || !process.env.MONGODB_URI?.trim()) return;
  const delay = retryDelay();
  console.warn(`[db] Retrying MongoDB in ${delay} ms. The API will remain fail-closed until persistence is ready.`);
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null;
    connectDB().catch(() => {});
  }, delay);
}

async function connectOnce() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const error = new Error('MONGODB_URI is required');
    state.error = error;
    if (!memoryAllowed()) {
      state.mode = 'unavailable';
      console.error('[db] MONGODB_URI is required; configure it in server/.env or the deployment environment.');
      throw error;
    }
    state.mode = 'memory';
    console.warn('[db] MONGODB_URI is not set; explicit development in-memory storage is active.');
    return false;
  }

  const options = connectionOptions();
  state.mode = 'connecting';
  console.log(`[db] Connecting to MongoDB (selection timeout ${options.serverSelectionTimeoutMS} ms, IP family ${options.family || 'auto'})…`);
  try {
    const conn = await mongoose.connect(uri, options);
    await syncApplicationIndexes();
    state.indexesReady = true;
    state.ready = true;
    state.mode = 'mongodb';
    state.error = null;
    state.failures = 0;
    clearRetryTimer();
    console.log(`[db] MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    state.ready = false;
    state.indexesReady = false;
    state.error = error;
    state.failures += 1;
    // Index synchronization can fail after the socket has connected. Do not
    // leave that unusable connection alive while reporting memory/unavailable.
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
    if (!memoryAllowed()) {
      state.mode = 'unavailable';
      console.error(`[db] MongoDB is required but unavailable: ${safeErrorMessage(error)}`);
      console.error(`[db] ${connectionHint(error)}`);
      throw error;
    }
    state.mode = 'memory';
    console.warn(`[db] MongoDB unavailable; explicit development in-memory storage is active (${safeErrorMessage(error)}).`);
    return false;
  }
}

function connectDB() {
  if (state.ready) return Promise.resolve(true);
  if (state.mode === 'memory' && memoryAllowed()) return Promise.resolve(false);
  if (state.promise) return state.promise;
  clearRetryTimer();
  const attempt = connectOnce();
  state.promise = attempt;
  // Reset the cached attempt after either outcome so a temporary Atlas/network
  // failure is recoverable instead of poisoning every future readiness check.
  attempt.then(
    () => { if (state.promise === attempt) state.promise = null; },
    () => {
      if (state.promise === attempt) state.promise = null;
      scheduleRetry();
    },
  );
  return attempt;
}

function startDB() {
  state.retryEnabled = true;
  return connectDB();
}

async function whenReady() {
  // A long-running API owns the retry loop. Requests must neither wait through
  // the selection timeout nor bypass backoff by launching extra attempts.
  if (state.retryEnabled && !state.ready && state.mode !== 'memory') {
    throw Object.assign(new Error('Persistent database is unavailable'), { status: 503, cause: state.error });
  }
  try {
    await connectDB();
  } catch (error) {
    throw Object.assign(new Error('Persistent database is unavailable'), { status: 503, cause: error });
  }
  if (state.mode === 'unavailable' || state.mode === 'connecting') {
    throw Object.assign(new Error('Persistent database is unavailable'), { status: 503 });
  }
  return state.mode;
}

mongoose.connection.on('disconnected', () => {
  if (state.mode !== 'mongodb') return;
  state.ready = false;
  state.mode = 'unavailable';
  state.error = new Error('MongoDB connection was lost');
  state.failures += 1;
  console.error('[db] MongoDB connection was lost; persistent operations are unavailable.');
  scheduleRetry();
});

mongoose.connection.on('connected', () => {
  // On automatic driver recovery the application indexes were already
  // synchronized during the original connection. Initial connection is made
  // ready by connectOnce only after index synchronization completes.
  if (!state.indexesReady || state.ready) return;
  state.ready = true;
  state.mode = 'mongodb';
  state.error = null;
  state.failures = 0;
  clearRetryTimer();
  console.log('[db] MongoDB connection recovered; persistent operations are available.');
});

module.exports = {
  connectDB,
  startDB,
  whenReady,
  isReady: () => state.ready,
  mode: () => state.mode,
  lastError: () => state.error,
  retrying: () => Boolean(state.retryEnabled && !state.ready && state.mode !== 'memory' && process.env.MONGODB_URI?.trim()),
  memoryAllowed,
};
