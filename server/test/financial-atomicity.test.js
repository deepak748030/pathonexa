const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.ALLOW_IN_MEMORY = 'true';
process.env.JWT_SECRET = 'test-only-pathonexa-jwt-secret-at-least-32-characters';

const db = require('../src/config/db');
const Meta = require('../src/models/Meta');
const Patient = require('../src/models/Patient');
const Report = require('../src/models/Report');
const User = require('../src/models/User');
const TenantCounter = require('../src/models/TenantCounter');
const {
  commissions, meta, patients, reports, subscription, transactions,
} = require('../src/lib/store');
const { runWithTenant } = require('../src/lib/tenantContext');

const OWNER = new mongoose.Types.ObjectId().toString();
const PATIENT_ID = new mongoose.Types.ObjectId();
const REPORT_ID = new mongoose.Types.ObjectId();

function queryResult(value, onSession = () => {}) {
  return {
    session(session) {
      onSession(session);
      return this;
    },
    lean: async () => value,
    populate: async () => value,
  };
}

test('MongoDB report billing, collection, commission, and subscription writes share transaction sessions', async (t) => {
  const originals = {
    isReady: db.isReady,
    transaction: mongoose.connection.transaction,
    counterUpdate: TenantCounter.findOneAndUpdate,
    patientFind: Patient.findOne,
    patientUpdate: Patient.findOneAndUpdate,
    reportCreate: Report.create,
    reportFindOne: Report.findOne,
    reportFind: Report.find,
    userFindOneAndUpdate: User.findOneAndUpdate,
    metaFindOne: Meta.findOne,
    metaFind: Meta.find,
    metaFindOneAndUpdate: Meta.findOneAndUpdate,
    metaInsert: Meta.insertMany,
    metaCreate: Meta.create,
  };
  t.after(() => {
    db.isReady = originals.isReady;
    mongoose.connection.transaction = originals.transaction;
    TenantCounter.findOneAndUpdate = originals.counterUpdate;
    Patient.findOne = originals.patientFind;
    Patient.findOneAndUpdate = originals.patientUpdate;
    Report.create = originals.reportCreate;
    Report.findOne = originals.reportFindOne;
    Report.find = originals.reportFind;
    User.findOneAndUpdate = originals.userFindOneAndUpdate;
    Meta.findOne = originals.metaFindOne;
    Meta.find = originals.metaFind;
    Meta.findOneAndUpdate = originals.metaFindOneAndUpdate;
    Meta.insertMany = originals.metaInsert;
    Meta.create = originals.metaCreate;
  });

  db.isReady = () => true;
  const sessions = [];
  mongoose.connection.transaction = async (work) => {
    const session = { id: `session-${sessions.length + 1}` };
    sessions.push(session);
    return work(session);
  };
  TenantCounter.findOneAndUpdate = () => ({ lean: async () => ({ value: 1 }) });

  const patient = { _id: PATIENT_ID, pid: 'PT260822001', name: 'Atomic Patient' };
  Patient.findOne = () => queryResult(patient, (session) => {
    assert.equal(session, sessions.at(-1));
  });
  Patient.findOneAndUpdate = async (_filter, _update, options) => {
    assert.equal(options.session, sessions.at(-1));
    return patient;
  };
  User.findOneAndUpdate = (_filter, _update, options) => {
    assert.equal(options.session, sessions.at(-1));
    return { lean: async () => ({ _id: OWNER }) };
  };

  Report.create = async ([data], options) => {
    assert.equal(options.session, sessions.at(-1));
    const stored = { ...data, _id: REPORT_ID };
    return [{ ...stored, toObject: () => stored }];
  };

  Meta.findOne = () => queryResult(null, (session) => {
    assert.equal(session, sessions.at(-1));
  }); // first-use onboarding marker
  Meta.insertMany = async (_documents, options) => {
    assert.equal(options.session, sessions.at(-1));
    return [];
  };
  const ledgerSessions = [];
  Meta.create = async (input, options) => {
    assert.equal(options.session, sessions.at(-1));
    if (input[0].kind === 'onboarding') return input;
    ledgerSessions.push(options.session);
    return [{ _id: new mongoose.Types.ObjectId(), data: input[0].data }];
  };

  const created = await runWithTenant({ id: OWNER, mobile: '9876543210' }, () => reports.create({
    patient: String(PATIENT_ID),
    test: 'CBC',
    amount: 100,
    paidAmount: 25,
    pendingAmount: 75,
  }));
  assert.equal(created.paidAmount, 25);
  assert.equal(sessions.length, 2); // tenant onboarding + report billing
  assert.deepEqual(ledgerSessions, [sessions[1]]);

  const reportDocument = {
    _id: REPORT_ID,
    reportId: created.reportId,
    patient,
    amount: 100,
    paidAmount: 25,
    pendingAmount: 75,
    paymentMode: 'Cash',
    async save(options) { assert.equal(options.session, sessions.at(-1)); },
    toObject() { return { ...this }; },
  };
  Report.findOne = () => queryResult(reportDocument, (session) => {
    assert.equal(session, sessions.at(-1));
  });

  const collected = await runWithTenant({ id: OWNER, mobile: '9876543210' }, () => transactions.collect({
    reportId: String(REPORT_ID), amount: 40, mode: 'UPI',
  }));
  assert.equal(collected.report.paidAmount, 65);
  assert.equal(collected.report.pendingAmount, 35);
  assert.equal(sessions.length, 3);
  assert.deepEqual(ledgerSessions, [sessions[1], sessions[2]]);

  const doctorId = new mongoose.Types.ObjectId();
  Meta.findOneAndUpdate = () => ({
    lean: async () => ({ _id: doctorId, data: { name: 'Atomic Doctor', commission: 10 } }),
  });
  Report.find = () => queryResult([{ commission: 10 }], (session) => {
    assert.equal(session, sessions.at(-1));
  });
  Meta.find = () => queryResult([], (session) => {
    assert.equal(session, sessions.at(-1));
  });

  const payout = await runWithTenant({ id: OWNER, mobile: '9876543210' }, () => commissions.pay({
    doctorId: String(doctorId), amount: 10, mode: 'Cash',
  }));
  assert.equal(payout.amount, 10);
  assert.equal(sessions.length, 4);
  // Commission record and its matching transaction share the same session.
  assert.deepEqual(ledgerSessions, [sessions[1], sessions[2], sessions[3], sessions[3]]);

  const subscriptionDoc = {
    data: {
      plan: 'Free Trial',
      planId: 'trial',
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
      history: [],
    },
    markModified(path) { assert.equal(path, 'data'); },
    async save(options) { assert.equal(options.session, sessions.at(-1)); },
  };
  let subscriptionSession;
  User.findOneAndUpdate = (_filter, _update, options) => {
    assert.equal(options.session, sessions.at(-1));
    subscriptionSession = options.session;
    return { lean: async () => ({ _id: OWNER }) };
  };
  Meta.findOne = () => ({
    sort() { return this; },
    session(session) {
      assert.equal(session, sessions.at(-1));
      return this;
    },
    then(resolve) { resolve(subscriptionDoc); },
  });

  const activated = await runWithTenant({ id: OWNER, mobile: '9876543210' }, () => (
    subscription.subscribe('monthly')
  ));
  assert.equal(activated.planId, 'monthly');
  assert.equal(sessions.length, 5);
  assert.equal(subscriptionSession, sessions[4]);
  assert.equal(ledgerSessions.at(-1), sessions[4]);
});

test('MongoDB delete and archive operations share one transaction session', async (t) => {
  const originals = {
    isReady: db.isReady,
    transaction: mongoose.connection.transaction,
    patientFind: Patient.findOne,
    patientDelete: Patient.deleteOne,
    reportExists: Report.exists,
    reportFindOneAndDelete: Report.findOneAndDelete,
    metaFindOne: Meta.findOne,
    metaDeleteOne: Meta.deleteOne,
    metaCreate: Meta.create,
  };
  t.after(() => {
    db.isReady = originals.isReady;
    mongoose.connection.transaction = originals.transaction;
    Patient.findOne = originals.patientFind;
    Patient.deleteOne = originals.patientDelete;
    Report.exists = originals.reportExists;
    Report.findOneAndDelete = originals.reportFindOneAndDelete;
    Meta.findOne = originals.metaFindOne;
    Meta.deleteOne = originals.metaDeleteOne;
    Meta.create = originals.metaCreate;
  });

  db.isReady = () => true;
  const sessions = [];
  mongoose.connection.transaction = async (work) => {
    const session = { id: `delete-session-${sessions.length + 1}` };
    sessions.push(session);
    return work(session);
  };
  const assertSessionQuery = (value) => ({
    session(session) {
      assert.equal(session, sessions.at(-1));
      return Promise.resolve(value);
    },
  });
  const patient = { _id: PATIENT_ID, pid: 'PT260822001', mobile: '9876543210' };
  Patient.findOne = () => queryResult(patient, (session) => {
    assert.equal(session, sessions.at(-1));
  });
  Report.exists = () => assertSessionQuery(null);
  Patient.deleteOne = () => assertSessionQuery({ deletedCount: 1 });
  const archivedSessions = [];
  Meta.create = async (_records, options) => {
    assert.equal(options.session, sessions.at(-1));
    archivedSessions.push(options.session);
    return [];
  };

  const removedPatient = await runWithTenant({ id: OWNER }, () => patients.remove(String(PATIENT_ID)));
  assert.equal(removedPatient.pid, patient.pid);
  assert.equal(sessions.length, 1);
  assert.equal(archivedSessions[0], sessions[0]);

  const report = { _id: REPORT_ID, reportId: 'RP260822001', patient: PATIENT_ID };
  Report.findOneAndDelete = () => queryResult(report, (session) => {
    assert.equal(session, sessions.at(-1));
  });
  const removedReport = await runWithTenant({ id: OWNER }, () => reports.remove(String(REPORT_ID)));
  assert.equal(removedReport.reportId, report.reportId);
  assert.equal(sessions.length, 2);
  assert.equal(archivedSessions[1], sessions[1]);

  const expenseId = new mongoose.Types.ObjectId();
  const expense = { _id: expenseId, data: { name: 'Atomic expense', amount: 10 } };
  Meta.findOne = () => assertSessionQuery(expense);
  Meta.deleteOne = () => assertSessionQuery({ deletedCount: 1 });
  const removedExpense = await runWithTenant({ id: OWNER }, () => meta.expenses.remove(String(expenseId)));
  assert.equal(removedExpense.amount, 10);
  assert.equal(sessions.length, 3);
  assert.equal(archivedSessions[2], sessions[2]);
});

test('MongoDB financial mutations fail closed when atomic transactions are unavailable', async (t) => {
  const originalReady = db.isReady;
  const originalTransaction = mongoose.connection.transaction;
  t.after(() => {
    db.isReady = originalReady;
    mongoose.connection.transaction = originalTransaction;
  });

  db.isReady = () => true;
  mongoose.connection.transaction = async () => {
    throw Object.assign(new Error('Transaction numbers are only allowed on a replica set member or mongos'), { code: 20 });
  };

  await assert.rejects(
    runWithTenant({ id: new mongoose.Types.ObjectId().toString() }, () => transactions.collect({
      reportId: String(REPORT_ID), amount: 1,
    })),
    (error) => error.status === 503 && /transaction-capable MongoDB/.test(error.message),
  );
});
