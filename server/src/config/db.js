const mongoose = require('mongoose');

const state = {
  mode: 'connecting',
  ready: false,
  error: null,
  promise: null,
};

function memoryAllowed() {
  // Persistence is mandatory unless an operator explicitly enables the
  // disposable adapter (or the isolated test suite is running).
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY === 'true';
}

async function syncApplicationIndexes() {
  // Models are registered by store.js before connectDB is called from index.js.
  // syncIndexes removes the old globally-unique pid/reportId indexes, installs
  // owner-scoped compound indexes, and enforces unique account/challenge keys.
  const names = ['User', 'OtpChallenge', 'Patient', 'Report', 'Meta', 'TenantCounter'];
  await Promise.all(names.filter((name) => mongoose.models[name]).map((name) => mongoose.models[name].syncIndexes()));
}

async function connectOnce() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error('MONGODB_URI is required');
    state.error = error;
    if (!memoryAllowed()) {
      state.mode = 'unavailable';
      throw error;
    }
    state.mode = 'memory';
    console.warn('[db] MONGODB_URI is not set; explicit development in-memory storage is active.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 4000,
      autoIndex: false,
    });
    await syncApplicationIndexes();
    state.ready = true;
    state.mode = 'mongodb';
    state.error = null;
    console.log(`[db] MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    state.ready = false;
    state.error = error;
    // Index synchronization can fail after the socket has connected. Do not
    // leave that unusable connection alive while reporting memory/unavailable.
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
    if (!memoryAllowed()) {
      state.mode = 'unavailable';
      console.error(`[db] MongoDB is required but unavailable: ${error.message}`);
      throw error;
    }
    state.mode = 'memory';
    console.warn(`[db] MongoDB unavailable; explicit development in-memory storage is active (${error.message}).`);
    return false;
  }
}

function connectDB() {
  if (!state.promise) state.promise = connectOnce();
  return state.promise;
}

async function whenReady() {
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

module.exports = {
  connectDB,
  whenReady,
  isReady: () => state.ready,
  mode: () => state.mode,
  memoryAllowed,
};
