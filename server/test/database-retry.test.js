const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

function waitFor(predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (predicate()) return resolve();
      if (Date.now() >= deadline) return reject(new Error('Timed out waiting for MongoDB retry'));
      return setTimeout(check, 20);
    };
    check();
  });
}

test('a failed required MongoDB attempt is retried and can recover', async (t) => {
  const originalEnv = { ...process.env };
  const originalConnect = mongoose.connect;
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const logs = [];
  let attempts = 0;
  let receivedOptions;

  process.env.NODE_ENV = 'production';
  process.env.ALLOW_IN_MEMORY = 'false';
  process.env.MONGODB_URI = 'mongodb+srv://db-user:secret-password@example.test/pathonexa';
  process.env.MONGODB_TIMEOUT_MS = '777';
  process.env.MONGODB_RETRY_MS = '10'; // validated/clamped to the safe 250 ms minimum
  process.env.MONGODB_RETRY_MAX_MS = '250';
  delete process.env.MONGODB_FAMILY;

  console.log = (...values) => logs.push(values.join(' '));
  console.warn = (...values) => logs.push(values.join(' '));
  console.error = (...values) => logs.push(values.join(' '));
  mongoose.connect = async (uri, options) => {
    attempts += 1;
    receivedOptions = options;
    if (attempts === 1) {
      throw new Error(`Server selection timed out for ${uri}`);
    }
    return { connection: { host: 'example.test', name: 'pathonexa' } };
  };

  t.after(() => {
    mongoose.connect = originalConnect;
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    process.env = originalEnv;
  });

  // Requiring after environment/mongoose setup keeps this test independent of
  // the in-memory setup used by the API integration test files.
  const db = require('../src/config/db');
  await assert.rejects(db.startDB(), /Server selection timed out/);
  assert.equal(db.mode(), 'unavailable');
  assert.equal(db.isReady(), false);

  await waitFor(() => db.isReady());
  assert.equal(attempts, 2);
  assert.equal(db.mode(), 'mongodb');
  assert.equal(receivedOptions.serverSelectionTimeoutMS, 777);
  assert.equal(receivedOptions.family, 4);
  assert.match(logs.join('\n'), /Retrying MongoDB in 250 ms/);
  assert.doesNotMatch(logs.join('\n'), /secret-password/);
});
