const mongoose = require('mongoose');

/**
 * Connects to MongoDB. The server NEVER crashes when Mongo is unavailable:
 * the store layer falls back to an in-memory database automatically, so the
 * API keeps working for local development / demos.
 */
const state = { ready: false };

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[db] MONGODB_URI not set — running with the in-memory store.');
    return false;
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    state.ready = true;
    console.log(`[db] MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    state.ready = false;
    console.warn(`[db] MongoDB connection failed (${error.message}) — falling back to the in-memory store.`);
    return false;
  }
}

module.exports = {
  connectDB,
  isReady: () => state.ready,
};
