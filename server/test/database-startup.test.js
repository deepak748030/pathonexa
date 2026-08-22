const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function request(port, pathname, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
    }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { text += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(text) });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.once('error', reject);
    req.setTimeout(4000, () => req.destroy(new Error('HTTP request timed out')));
    if (payload) req.write(payload);
    req.end();
  });
}

function waitForOutput(readOutput, predicate, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const output = readOutput();
      if (predicate(output)) return resolve(output);
      if (Date.now() >= deadline) return reject(new Error(`Timed out waiting for server output:\n${output}`));
      return setTimeout(check, 25);
    };
    check();
  });
}

test('HTTP server stays alive, reports 503, and retries when required MongoDB is unavailable', async (t) => {
  const port = await freePort();
  const serverDirectory = path.resolve(__dirname, '..');
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: serverDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      ALLOW_IN_MEMORY: 'false',
      JWT_SECRET: 'database-startup-test-secret-with-32-characters',
      MONGODB_URI: 'mongodb://127.0.0.1:1/pathonexa?directConnection=true',
      MONGODB_TIMEOUT_MS: '300',
      MONGODB_CONNECT_TIMEOUT_MS: '300',
      MONGODB_RETRY_MS: '250',
      MONGODB_RETRY_MAX_MS: '250',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
  });

  await waitForOutput(() => output, (text) => text.includes('PathoNexa API listening'));
  await waitForOutput(() => output, (text) => text.includes('database-wait mode'));
  assert.equal(child.exitCode, null, output);

  const health = await request(port, '/api/health');
  assert.equal(health.status, 503);
  assert.equal(health.body.status, 'unavailable');
  assert.equal(health.body.persistent, false);
  assert.equal(health.body.retrying, true);
  assert.match(health.body.db, /connecting|unavailable/);

  const login = await request(port, '/api/auth/login', {
    method: 'POST',
    body: { mobile: '9999999999' },
  });
  assert.equal(login.status, 503);
  assert.equal(login.body.message, 'Persistent database is unavailable');

  const protectedResponse = await request(port, '/api/patients');
  assert.equal(protectedResponse.status, 503);
  assert.equal(protectedResponse.body.message, 'Persistent database is unavailable');

  await waitForOutput(
    () => output,
    (text) => (text.match(/MongoDB is required but unavailable/g) || []).length >= 2,
  );
  assert.equal(child.exitCode, null, output);
  assert.match(output, /Network Access\/IP allowlisting/);
  assert.doesNotMatch(output, /Startup aborted/);
});
