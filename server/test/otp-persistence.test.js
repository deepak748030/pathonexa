const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.ALLOW_IN_MEMORY = 'true';
process.env.JWT_SECRET = 'test-only-pathonexa-jwt-secret-at-least-32-characters';
process.env.INTERNAL_OTP = '123456';

const db = require('../src/config/db');
const OtpChallenge = require('../src/models/OtpChallenge');
const { auth } = require('../src/lib/store');

const MOBILE = '9876543210';

function hashOtp(otp) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${MOBILE}:${otp}`).digest('hex');
}

function assertSnapshot(filter, challenge) {
  assert.equal(String(filter._id), String(challenge._id));
  assert.equal(filter.hash, challenge.hash);
  assert.equal(new Date(filter.requestedAt).getTime(), challenge.requestedAt.getTime());
  const expiry = filter.expiresAt?.$eq ?? filter.expiresAt;
  assert.equal(new Date(expiry).getTime(), challenge.expiresAt.getTime());
}

test('MongoDB OTP mutations are bound to the challenge snapshot across resend races', async (t) => {
  const originals = {
    whenReady: db.whenReady,
    isReady: db.isReady,
    findOne: OtpChallenge.findOne,
    deleteOne: OtpChallenge.deleteOne,
    updateOne: OtpChallenge.updateOne,
    findOneAndDelete: OtpChallenge.findOneAndDelete,
  };
  t.after(() => {
    db.whenReady = originals.whenReady;
    db.isReady = originals.isReady;
    OtpChallenge.findOne = originals.findOne;
    OtpChallenge.deleteOne = originals.deleteOne;
    OtpChallenge.updateOne = originals.updateOne;
    OtpChallenge.findOneAndDelete = originals.findOneAndDelete;
  });

  db.whenReady = async () => 'mongodb';
  db.isReady = () => true;

  let challenge = {
    _id: new mongoose.Types.ObjectId(),
    hash: hashOtp('123456'),
    requestedAt: new Date(Date.now() - 10 * 60_000),
    expiresAt: new Date(Date.now() - 5 * 60_000),
    attempts: 0,
  };
  OtpChallenge.findOne = () => ({ lean: async () => challenge });

  let deleteFilter;
  OtpChallenge.deleteOne = async (filter) => { deleteFilter = filter; return { deletedCount: 1 }; };
  await assert.rejects(auth.verify(MOBILE, '123456'), /Invalid or expired OTP/);
  assertSnapshot(deleteFilter, challenge);
  assert.equal(deleteFilter.attempts, challenge.attempts);

  challenge = {
    ...challenge,
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60_000),
  };
  let updateFilter;
  OtpChallenge.updateOne = async (filter) => { updateFilter = filter; return { modifiedCount: 1 }; };
  await assert.rejects(auth.verify(MOBILE, '000000'), /Invalid or expired OTP/);
  assertSnapshot(updateFilter, challenge);
  assert.deepEqual(updateFilter.attempts, { $lt: 5 });
  assert.ok(updateFilter.expiresAt.$gt instanceof Date);

  let consumeFilter;
  OtpChallenge.findOneAndDelete = async (filter) => { consumeFilter = filter; return null; };
  await assert.rejects(auth.verify(MOBILE, '123456'), /Invalid or expired OTP/);
  assertSnapshot(consumeFilter, challenge);
  assert.deepEqual(consumeFilter.attempts, { $lt: 5 });
  assert.ok(consumeFilter.expiresAt.$gt instanceof Date);
});
