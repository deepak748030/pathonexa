/**
 * Tenant-isolated PathoNexa data store.
 *
 * Production uses MongoDB. Development may explicitly use the in-memory
 * adapter, which is partitioned by authenticated account and never contains
 * demo patients, reports, doctors, transactions, or notifications.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const Meta = require('../models/Meta');
const TenantCounter = require('../models/TenantCounter');
const defaults = require('./seedData');
const cfg = require('../config/appConfig');
const razorpay = require('./razorpay');
const { authSecret } = require('./authSecret');
const { currentTenant, requireTenantId } = require('./tenantContext');

const COLLECTIONS = [
  'tests', 'doctors', 'employees', 'centers', 'payments', 'discounts',
  'templates', 'packages', 'expenses', 'transactions', 'commissions',
  'drafts', 'labs', 'roles',
];

const globalMem = { users: [], otpChallenges: new Map(), tenants: new Map() };

function newTenantState() {
  const state = {
    patients: [], reports: [], deleted: [], notificationState: {}, settings: null,
    subscription: null, seeded: false, lastBackupAt: null, sequences: {},
    pendingPatientMobiles: new Set(), pendingReportIds: new Set(),
  };
  COLLECTIONS.forEach((kind) => { state[kind] = []; });
  return state;
}

function tenantMemory() {
  const ownerId = requireTenantId();
  if (!globalMem.tenants.has(ownerId)) globalMem.tenants.set(ownerId, newTenantState());
  return globalMem.tenants.get(ownerId);
}

// Existing store operations use mem.*. This proxy guarantees those reads and
// writes resolve only inside the active authenticated account.
const mem = new Proxy({}, {
  get(_target, key) { return tenantMemory()[key]; },
  set(_target, key, value) { tenantMemory()[key] = value; return true; },
});

function byIdOrPid(id) {
  if (mongoose.isValidObjectId(id)) return { $or: [{ _id: id }, { pid: id }, { reportId: id }] };
  return { $or: [{ pid: id }, { reportId: id }] };
}

const makeId = () => crypto.randomBytes(12).toString('hex');
const pad = (n, w = 3) => String(n).padStart(w, '0');
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n) => num(n).toLocaleString('en-IN');
const inr = (n) => `₹${fmt(Math.round(num(n)))}`;

function genPid(now = new Date(), seq = 1) {
  const ymd = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  return `PT${ymd}${pad(seq)}`;
}
function genReportId(seq = 1, now = new Date()) {
  const ymd = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  return `RP${ymd}${pad(seq)}`;
}
async function nextSequence(key) {
  ensureSeeded();
  if (useMemory()) {
    mem.sequences[key] = num(mem.sequences[key]) + 1;
    return mem.sequences[key];
  }
  const counter = await TenantCounter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return counter.value;
}
async function setSequenceAtLeast(key, value) {
  const minimum = Math.max(0, Math.floor(num(value)));
  if (useMemory()) {
    mem.sequences[key] = Math.max(num(mem.sequences[key]), minimum);
    return;
  }
  await TenantCounter.findOneAndUpdate(
    { key },
    { $max: { value: minimum } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}
function maxSequence(records, field) {
  return records.reduce((max, record) => {
    const id = String(record?.[field] || '');
    return Math.max(max, /^\D{2}\d{6}\d+$/.test(id) ? num(id.slice(8)) : 0);
  }, 0);
}
async function sequenceState() {
  if (useMemory()) return { patient: num(mem.sequences.patient), report: num(mem.sequences.report) };
  const counters = await TenantCounter.find({ key: { $in: ['patient', 'report'] } }).lean();
  return Object.fromEntries(counters.map((counter) => [counter.key, num(counter.value)]));
}
function daysAgo(d) { return new Date(Date.now() - d * 24 * 3600 * 1000); }
function dateLabel(d = new Date()) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function timeLabel(d = new Date()) { return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }

function paged(list, query = {}) {
  const wantsPage = query.page !== undefined || query.limit !== undefined;
  if (!wantsPage) return list;
  const page = Math.max(1, Math.floor(num(query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(num(query.limit) || 10)));
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const items = list.slice((page - 1) * limit, page * limit);
  return { items, pagination: { page, limit, total, pages, hasMore: page * limit < total } };
}

function withIds(list) {
  return (list || []).map((item) => {
    const _id = makeId();
    return { ...structuredClone(item), _id, id: _id, seedId: item.id, createdAt: new Date(), updatedAt: new Date() };
  });
}

function defaultSettings() {
  const tenant = currentTenant();
  return {
    name: 'My Pathology Lab', shortName: 'My Pathology Lab', city: '',
    labId: `LAB${String(tenant?.id || '').slice(-6).toUpperCase()}`, phone: tenant?.mobile ? `+91 ${tenant.mobile}` : '',
    altPhone: '', email: '', website: '', address: '', pathologist: '', gst: '',
    logo: '', signature: '', stamp: '',
    footer: 'This is a computer generated report and does not require physical signature.',
    reportNote: 'Kindly correlate clinically. Results relate only to the sample tested.',
    whatsappTemplate: 'Hello {patient},\n\nYour pathology report is ready.\nReport ID: {reportId}\n\nThank You.\n{lab}',
    theme: 'Blue', language: 'English', autoPrint: true, notifications: true,
    ownerVerification: true, autoBackup: true, currency: cfg.currencySymbol,
  };
}

function defaultSubscription() {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + cfg.trialDays * 24 * 3600 * 1000);
  return { plan: 'Free Trial', planId: 'trial', status: 'Active', startedAt, expiresAt, amount: 0, autoRenew: false, history: [] };
}

function seedMemory() {
  if (mem.seeded) return;
  mem.seeded = true;
  // Clinical test definitions are account-owned onboarding templates, not
  // demo activity. All business records start empty.
  mem.tests = withIds(defaults.tests || []);
  mem.settings = defaultSettings();
  mem.subscription = defaultSubscription();
}

const mongoOnboarding = new Map();
async function ensureMongoSeeded() {
  if (useMemory()) return;
  const ownerId = requireTenantId();
  if (!mongoOnboarding.has(ownerId)) {
    mongoOnboarding.set(ownerId, mongoTransaction(async (session) => {
      // Serialize first-use seeding across all API instances. The marker and
      // defaults commit together, so a crash cannot leave a half-seeded tenant.
      const account = await User.findOneAndUpdate(
        { _id: ownerId },
        { $set: { updatedAt: new Date() } },
        { new: true, session },
      ).lean();
      if (!account) throw Object.assign(new Error('Account onboarding is unavailable'), { status: 503 });
      const marker = await Meta.findOne({ kind: 'onboarding' }).session(session).lean();
      if (marker) return;
      const docs = (defaults.tests || []).map(({ id, ...data }) => ({ kind: 'tests', data }));
      if (docs.length) await Meta.insertMany(docs, { session });
      await Meta.create([{
        kind: 'onboarding', data: { version: 1, completedAt: new Date() },
      }], { session });
    }, 'Account onboarding requires a transaction-capable MongoDB deployment')
      .catch((error) => { mongoOnboarding.delete(ownerId); throw error; }));
  }
  await mongoOnboarding.get(ownerId);
}

const useMemory = () => !db.isReady();
function ensureSeeded() { if (useMemory()) seedMemory(); }

async function all(kind) {
  ensureSeeded();
  if (useMemory()) return [...(mem[kind] || [])];
  await ensureMongoSeeded();
  const docs = await Meta.find({ kind }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({ ...d.data, _id: String(d._id), id: String(d._id), createdAt: d.createdAt, updatedAt: d.updatedAt }));
}

async function allReports() {
  ensureSeeded();
  if (useMemory()) return [...mem.reports];
  await ensureMongoSeeded();
  return Report.find().populate('patient').lean();
}

const OTP = cfg.internalOtp;
const OTP_RESEND_COOLDOWN_MS = 30_000;
const signToken = (user) => jwt.sign(
  { mobile: user.mobile, role: user.role }, authSecret(),
  { subject: String(user._id), expiresIn: '30d', algorithm: 'HS256', issuer: 'pathonexa-api', audience: 'pathonexa-app' },
);
function otpHash(mobile, otp) { return crypto.createHmac('sha256', authSecret()).update(`${mobile}:${otp}`).digest('hex'); }
function permissionsFor(roleName) {
  const role = (defaults.roles || []).find((r) => r.name.toLowerCase() === String(roleName || '').toLowerCase());
  return role ? role.permissions : (defaults.PERMISSIONS || []);
}
function publicUser(user) {
  return {
    id: String(user._id),
    mobile: user.mobile,
    name: user.name,
    email: user.email || '',
    role: user.role,
    permissions: permissionsFor(user.role),
  };
}

const auth = {
  async login(mobile) {
    await db.whenReady();
    mobile = String(mobile || '').trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) throw Object.assign(new Error('A valid 10-digit Indian mobile number is required'), { status: 400 });
    const now = Date.now();
    const challenge = {
      hash: otpHash(mobile, OTP),
      expiresAt: new Date(now + 5 * 60_000),
      requestedAt: new Date(now),
      attempts: 0,
    };
    if (useMemory()) {
      const existing = globalMem.otpChallenges.get(mobile);
      if (existing && now - existing.requestedAt < OTP_RESEND_COOLDOWN_MS) throw Object.assign(new Error('Please wait before requesting another OTP'), { status: 429 });
      globalMem.otpChallenges.set(mobile, { ...challenge, expiresAt: challenge.expiresAt.getTime(), requestedAt: now });
    } else {
      try {
        // The unique mobile index makes the cooldown atomic across concurrent
        // requests and across multiple API instances.
        await OtpChallenge.findOneAndUpdate(
          {
            mobile,
            $or: [
              { requestedAt: { $lte: new Date(now - OTP_RESEND_COOLDOWN_MS) } },
              { requestedAt: { $exists: false } },
            ],
          },
          { $set: challenge },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        if (error?.code === 11000) throw Object.assign(new Error('Please wait before requesting another OTP'), { status: 429 });
        throw error;
      }
    }
    return { message: 'OTP sent successfully', expiresInSeconds: 300 };
  },

  async verify(mobile, otp) {
    await db.whenReady();
    mobile = String(mobile || '').trim();
    otp = String(otp || '').trim();
    if (!/^[6-9]\d{9}$/.test(mobile) || !/^\d{6}$/.test(otp)) throw Object.assign(new Error('Mobile number and OTP are required'), { status: 400 });
    const now = Date.now();
    const challenge = useMemory()
      ? globalMem.otpChallenges.get(mobile)
      : await OtpChallenge.findOne({ mobile }).lean();
    if (!challenge || new Date(challenge.expiresAt).getTime() <= now || challenge.attempts >= 5) {
      if (useMemory()) globalMem.otpChallenges.delete(mobile);
      else if (challenge?._id) {
        // Match the challenge snapshot so a concurrent resend cannot have its
        // freshly reset challenge deleted by this stale verification.
        await OtpChallenge.deleteOne({
          _id: challenge._id,
          hash: challenge.hash,
          expiresAt: challenge.expiresAt,
          requestedAt: challenge.requestedAt,
          attempts: challenge.attempts,
        });
      }
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }

    const challengeSnapshot = {
      _id: challenge._id,
      hash: challenge.hash,
      expiresAt: challenge.expiresAt,
      requestedAt: challenge.requestedAt,
    };
    const actual = Buffer.from(challenge.hash, 'hex');
    const supplied = Buffer.from(otpHash(mobile, otp), 'hex');
    const valid = actual.length === supplied.length && crypto.timingSafeEqual(actual, supplied);
    if (!valid) {
      if (useMemory()) challenge.attempts += 1;
      else {
        await OtpChallenge.updateOne(
          { ...challengeSnapshot, expiresAt: { $eq: challenge.expiresAt, $gt: new Date() }, attempts: { $lt: 5 } },
          { $inc: { attempts: 1 } },
        );
      }
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }

    if (useMemory()) globalMem.otpChallenges.delete(mobile);
    else {
      // Deleting with the validity constraints is the atomic one-time consume:
      // only one concurrent verification can exchange this challenge for JWT.
      const consumed = await OtpChallenge.findOneAndDelete({
        ...challengeSnapshot,
        expiresAt: { $eq: challenge.expiresAt, $gt: new Date() },
        attempts: { $lt: 5 },
      });
      if (!consumed) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }

    let user;
    if (useMemory()) {
      user = globalMem.users.find((item) => item.mobile === mobile);
      if (!user) {
        user = { _id: makeId(), mobile, name: 'Lab Owner', role: 'Lab Owner', createdAt: new Date() };
        globalMem.users.push(user);
      }
    } else {
      try {
        user = await User.findOneAndUpdate(
          { mobile },
          { $setOnInsert: { mobile, name: 'Lab Owner', role: 'Lab Owner' } },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        // A unique-index race can only mean another verifier created the same
        // mobile account first; always converge on that single account.
        if (error?.code !== 11000) throw error;
        user = await User.findOne({ mobile });
        if (!user) throw error;
      }
    }
    return { token: signToken(user), user: publicUser(user) };
  },

  async findUser(id) {
    if (db.isReady()) return User.findById(id).lean();
    return globalMem.users.find((user) => String(user._id) === String(id)) || null;
  },

  async me(id) {
    const user = await auth.findUser(id);
    if (!user) throw Object.assign(new Error('Account not found'), { status: 404 });
    return { user: publicUser(user) };
  },

  async updateProfile(id, patch) {
    await db.whenReady();
    const name = String(patch?.name || '').trim();
    const email = String(patch?.email || '').trim().toLowerCase();
    if (!name) throw Object.assign(new Error('Your name is required'), { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Object.assign(new Error('Enter a valid email address'), { status: 400 });
    }
    let user;
    if (db.isReady()) {
      user = await User.findByIdAndUpdate(
        id,
        { $set: { name, email } },
        { new: true, runValidators: true },
      ).lean();
    } else {
      user = globalMem.users.find((item) => String(item._id) === String(id));
      if (user) {
        user.name = name;
        user.email = email;
      }
    }
    if (!user) throw Object.assign(new Error('Account not found'), { status: 404 });
    return { user: publicUser(user) };
  },
};

const roles = {
  async list() {
    const custom = await all('roles');
    return custom.length ? custom : defaults.roles;
  },
  permissions: () => defaults.PERMISSIONS,
};

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */

const PATIENT_FIELDS = [
  'name', 'age', 'gender', 'blood', 'mobile', 'altMobile', 'address', 'city',
  'state', 'pincode', 'email', 'dob', 'remarks', 'referredBy', 'lastTest',
  'lastTestDate', 'group', 'photo', 'color',
];

function badRequest(message) {
  throw Object.assign(new Error(message), { status: 400 });
}

function transactionUnsupported(error) {
  return error?.code === 20
    || /Transaction numbers are only allowed|does not support transactions|replica set member or mongos/i
      .test(error?.message || '');
}

async function mongoTransaction(work, unavailableMessage) {
  try {
    return await mongoose.connection.transaction(work);
  } catch (error) {
    if (transactionUnsupported(error)) {
      throw Object.assign(new Error(unavailableMessage), { status: 503 });
    }
    throw error;
  }
}

function patientPatch(data, requireAll = false) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const out = {};
  PATIENT_FIELDS.forEach((field) => {
    if (source[field] !== undefined) out[field] = source[field];
  });

  ['name', 'mobile'].forEach((field) => {
    if (out[field] !== undefined) out[field] = String(out[field]).trim();
  });
  if (out.age !== undefined) {
    if (out.age === '' || out.age === null || !Number.isFinite(Number(out.age))) badRequest('Age must be between 0 and 150');
    out.age = Number(out.age);
  }

  if (requireAll && (!out.name || !out.mobile || out.age === undefined || !out.gender)) {
    badRequest('Name, mobile, age and gender are required');
  }
  if (out.name !== undefined && !out.name) badRequest('Patient name is required');
  if (out.mobile !== undefined && !/^[6-9]\d{9}$/.test(out.mobile)) badRequest('Enter a valid 10-digit Indian mobile number');
  if (out.age !== undefined && (out.age < 0 || out.age > 150)) badRequest('Age must be between 0 and 150');
  if (out.gender !== undefined && !['Male', 'Female', 'Other'].includes(out.gender)) badRequest('Gender must be Male, Female or Other');
  return out;
}

const patients = {
  async list(query = {}) {
    ensureSeeded();
    let list;
    if (useMemory()) list = [...mem.patients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else {
      await ensureMongoSeeded();
      list = await Patient.find().sort({ createdAt: -1 }).lean();
    }
    const q = String(query.q || query.search || '').trim().toLowerCase().slice(0, 100);
    const gender = String(query.gender || '');
    if (q) list = list.filter((patient) => [patient.name, patient.pid, patient.mobile, patient.lastTest]
      .some((value) => String(value || '').toLowerCase().includes(q)));
    if (['Male', 'Female', 'Other'].includes(gender)) list = list.filter((patient) => patient.gender === gender);
    return paged(list, query);
  },

  async getById(id) {
    ensureSeeded();
    if (useMemory()) {
      const p = mem.patients.find((x) => x._id === id || x.pid === id);
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      return p;
    }
    const p = await Patient.findOne(byIdOrPid(id)).lean();
    if (!p) {
      const err = new Error('Patient not found');
      err.status = 404;
      throw err;
    }
    return p;
  },

  async update(id, patch) {
    ensureSeeded();
    const allowed = patientPatch(patch);
    if (useMemory()) {
      const p = mem.patients.find((x) => x._id === id || x.pid === id);
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      if (allowed.mobile && mem.patients.some((item) => item !== p && item.mobile === allowed.mobile)) {
        badRequest('A patient with this mobile number already exists');
      }
      Object.assign(p, allowed, { updatedAt: new Date() });
      return p;
    }
    try {
      const p = await Patient.findOneAndUpdate(
        byIdOrPid(id),
        { $set: allowed },
        { new: true, runValidators: true },
      ).lean();
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      return p;
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.mobile) {
        badRequest('A patient with this mobile number already exists');
      }
      throw error;
    }
  },

  async remove(id) {
    ensureSeeded();
    if (useMemory()) {
      const i = mem.patients.findIndex((x) => x._id === id || x.pid === id);
      if (i < 0) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      const patient = mem.patients[i];
      if (mem.reports.some((report) => reportPatientKeys(report.patient)
        .some((key) => [patient._id, patient.pid].includes(key)))) {
        throw Object.assign(new Error('Delete this patient’s reports first'), { status: 409 });
      }
      const [removed] = mem.patients.splice(i, 1);
      mem.deleted.unshift({ ...removed, kind: 'patients', deletedAt: new Date() });
      return removed;
    }
    return mongoTransaction(async (session) => {
      const p = await Patient.findOne(byIdOrPid(id)).session(session).lean();
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      const existingReport = await Report.exists({ patient: p._id }).session(session);
      if (existingReport) {
        throw Object.assign(new Error('Delete this patient’s reports first'), { status: 409 });
      }
      const deleted = await Patient.deleteOne({ _id: p._id }).session(session);
      if (deleted.deletedCount !== 1) throw Object.assign(new Error('Patient not found'), { status: 404 });
      await Meta.create([{
        kind: 'deleted', data: { ...p, kind: 'patients', deletedAt: new Date() },
      }], { session });
      return p;
    }, 'Atomic patient deletion requires a transaction-capable MongoDB deployment');
  },

  async stats() {
    ensureSeeded();
    const weekAgo = daysAgo(7);
    const list = await patients.list();
    const reportList = await allReports();
    const newThisWeek = list.filter((p) => new Date(p.createdAt) >= weekAgo).length;
    const reportsThisWeek = reportList.filter((r) => new Date(r.createdAt) >= weekAgo);
    const collection = reportsThisWeek.reduce((s, r) => s + num(r.amount), 0);
    return [
      { label: 'Total Patients', value: fmt(list.length), tone: 'primary' },
      { label: 'New This Week', value: fmt(newThisWeek), tone: 'green' },
      { label: 'Tests This Week', value: fmt(reportsThisWeek.length), tone: 'purple' },
      { label: 'This Week Collection', value: inr(collection), tone: 'orange' },
    ];
  },

  /** Same-mobile / same-name duplicates — powers the "Duplicates" tool. */
  async duplicates() {
    const list = await patients.list();
    const groups = new Map();
    list.forEach((p) => {
      const key = String(p.mobile || '').trim() || `${p.name}`.toLowerCase().trim();
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    });
    return Array.from(groups.entries())
      .filter(([, arr]) => arr.length > 1)
      .map(([key, arr]) => ({ key, count: arr.length, patients: arr }));
  },

  /** Bulk import used by the Patients → Import tool. */
  async importMany(rows) {
    const created = [];
    const skipped = [];
    for (const row of rows || []) {
      try {
        // eslint-disable-next-line no-await-in-loop
        created.push(await patients.create(row));
      } catch (e) {
        skipped.push({ row, reason: e.message });
      }
    }
    return { created: created.length, skipped: skipped.length, details: skipped };
  },

  async create(data) {
    const clean = patientPatch(data, true);
    ensureSeeded();
    if (useMemory()) {
      const exists = mem.patients.find((p) => p.mobile === clean.mobile);
      if (exists || mem.pendingPatientMobiles.has(clean.mobile)) {
        badRequest('A patient with this mobile number already exists');
      }
      mem.pendingPatientMobiles.add(clean.mobile);
      try {
        const doc = {
          ...clean,
          _id: makeId(),
          pid: genPid(new Date(), await nextSequence('patient')),
          color: clean.color || '#DBEAFE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mem.patients.unshift(doc);
        return doc;
      } finally {
        mem.pendingPatientMobiles.delete(clean.mobile);
      }
    }
    const exists = await Patient.findOne({ mobile: clean.mobile });
    if (exists) badRequest('A patient with this mobile number already exists');
    try {
      const doc = await Patient.create({ ...clean, pid: genPid(new Date(), await nextSequence('patient')) });
      return doc.toObject();
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.mobile) {
        throw Object.assign(new Error('A patient with this mobile number already exists'), { status: 400 });
      }
      throw error;
    }
  },
};

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

const REPORT_FIELDS = [
  'status', 'paid', 'amount', 'values', 'parameters', 'discount', 'paidAmount', 'pendingAmount',
  'paymentMode', 'remarks', 'sampleDate', 'reportDate', 'technician', 'verified',
  'verifiedBy', 'doctor', 'doctorId', 'test', 'tests', 'date', 'time', 'commission', 'commissionRate',
  'commissionPaid', 'transactionId', 'package', 'paymentRef',
];
const MONEY_FIELDS = ['amount', 'discount', 'paidAmount', 'pendingAmount'];

function money(value, label) {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0) {
    badRequest(`${label} must be a non-negative amount`);
  }
  return Number(value);
}

function normalizeReportFinancials(payload, current = null) {
  const out = payload;
  MONEY_FIELDS.forEach((field) => {
    if (out[field] !== undefined) out[field] = money(out[field], field);
  });
  if (out.amount === undefined && !current) badRequest('Report amount is required');

  const amount = out.amount ?? num(current?.amount);
  const paidAmount = out.paidAmount ?? (current ? num(current.paidAmount) : (out.paid ? amount : 0));
  if (paidAmount > amount) badRequest('Paid amount cannot exceed the report amount');
  const pendingAmount = Math.max(0, amount - paidAmount);
  if (out.pendingAmount !== undefined && Math.abs(out.pendingAmount - pendingAmount) > 0.001) {
    badRequest('Pending amount does not match the report balance');
  }
  if (out.paid !== undefined && Boolean(out.paid) !== (pendingAmount === 0)) {
    badRequest('Payment status does not match the report balance');
  }
  out.amount = amount;
  out.paidAmount = paidAmount;
  out.pendingAmount = pendingAmount;
  out.paid = pendingAmount === 0;
  return out;
}

async function doctorForReport(doctorName) {
  const name = String(doctorName || 'Direct').trim() || 'Direct';
  if (name === 'Direct') return { name: 'Direct', id: null, rate: 0 };
  const list = await all('doctors');
  const doctor = list.find((item) => item.name === name);
  if (!doctor) badRequest('Doctor not found');
  // Fall back to the .env default (DEFAULT_COMMISSION_PERCENT) when the
  // doctor's profile has no commission set. An explicit 0 stays 0.
  const rate = doctor.commission === undefined || doctor.commission === null || doctor.commission === ''
    ? cfg.defaultCommissionPercent
    : num(doctor.commission);
  return { name: doctor.name, id: String(doctor._id || doctor.id), rate };
}

/** Reject discounts above the configured cap (MAX_DISCOUNT_PERCENT in .env). */
function assertDiscountAllowed(amount, discount) {
  const disc = num(discount);
  if (disc <= 0) return;
  // `amount` is the payable (post-discount) figure, so the original bill
  // is amount + discount — the cap applies to that gross bill.
  const gross = num(amount) + disc;
  if (gross <= 0) return;
  const cap = Math.round((gross * cfg.maxDiscountPercent) / 100);
  if (disc > cap) {
    const err = new Error(
      `Discount ₹${disc} exceeds the allowed maximum of ${cfg.maxDiscountPercent}% (₹${cap}) of the bill.`
    );
    err.status = 400;
    throw err;
  }
}

const reports = {
  async list(query = {}) {
    ensureSeeded();
    let list;
    if (useMemory()) list = [...mem.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else {
      await ensureMongoSeeded();
      list = await Report.find().populate('patient').sort({ createdAt: -1 }).lean();
    }
    const q = String(query.q || query.search || '').trim().toLowerCase().slice(0, 100);
    const status = String(query.status || '');
    const from = query.from ? new Date(String(query.from)) : null;
    const to = query.to ? new Date(String(query.to)) : null;
    if (q) list = list.filter((report) => [report.patient?.name, report.patient?.pid, report.reportId, report.test, report.doctor]
      .some((value) => String(value || '').toLowerCase().includes(q)));
    if (['Pending', 'Completed', 'Cancelled'].includes(status)) list = list.filter((report) => report.status === status);
    if (from && !Number.isNaN(from.getTime())) list = list.filter((report) => new Date(report.createdAt) >= from);
    if (to && !Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      list = list.filter((report) => new Date(report.createdAt) <= to);
    }
    return paged(list, query);
  },

  async getById(id) {
    ensureSeeded();
    if (useMemory()) {
      const r = mem.reports.find((x) => x._id === id || x.reportId === id);
      if (!r) {
        const err = new Error('Report not found');
        err.status = 404;
        throw err;
      }
      return r;
    }
    const r = await Report.findOne(byIdOrPid(id)).populate('patient').lean();
    if (!r) {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    return r;
  },

  async nextReportId() {
    return genReportId(await nextSequence('report'));
  },

  async create(data) {
    const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const payload = {};
    ['reportId', 'patient', ...REPORT_FIELDS].forEach((field) => {
      if (source[field] !== undefined) payload[field] = source[field];
    });
    if (!payload.reportId) payload.reportId = await reports.nextReportId();
    payload.reportId = String(payload.reportId || '').trim();
    payload.test = String(payload.test || '').trim();
    const { reportId, patient, test } = payload;
    if (!reportId || !patient || !test || payload.amount === undefined) {
      badRequest('reportId, patient, test and amount are required');
    }
    if (payload.status !== undefined && !['Pending', 'Completed', 'Cancelled'].includes(payload.status)) {
      badRequest('Report status is invalid');
    }
    normalizeReportFinancials(payload);
    ensureSeeded();

    const referringDoctor = await doctorForReport(payload.doctor);
    assertDiscountAllowed(payload.amount, payload.discount);
    payload.doctor = referringDoctor.name;
    payload.doctorId = referringDoctor.id;
    payload.commissionRate = referringDoctor.rate;
    payload.commission = Math.round((num(payload.amount) * referringDoctor.rate) / 100);
    // Verification, financial identifiers, and commission settlement state are
    // server-owned and cannot be forged in a report creation payload.
    payload.verified = false;
    payload.verifiedBy = '';
    delete payload.transactionId;
    payload.commissionPaid = false;
    payload.date = payload.date || dateLabel();
    payload.time = payload.time || timeLabel();

    const initialLedgerEntry = (doc, ownPatient, options = {}) => (
      num(payload.paidAmount) > 0
        ? transactions.create({
          reportId: doc.reportId,
          report: String(doc._id),
          patient: ownPatient.name,
          patientId: String(ownPatient._id),
          amount: num(payload.paidAmount),
          mode: payload.paymentMode || 'Cash',
          type: 'Collection',
          note: payload.paymentRef ? `Razorpay ${payload.paymentRef}` : 'Report billing',
        }, options)
        : null
    );

    if (useMemory()) {
      if (mem.reports.some((item) => item.reportId === reportId) || mem.pendingReportIds.has(reportId)) {
        badRequest('A report with this report ID already exists');
      }
      mem.pendingReportIds.add(reportId);
      try {
        // Resolve the patient through this tenant's partition. The ledger write
        // is completed before exposing either the report or patient mutation.
        const ownPatient = await patients.getById(String(patient));
        const doc = {
          ...payload, _id: makeId(), patient: ownPatient,
          createdAt: new Date(), updatedAt: new Date(),
        };
        await initialLedgerEntry(doc, ownPatient);
        ownPatient.lastTest = payload.test;
        ownPatient.lastTestDate = payload.date;
        ownPatient.updatedAt = new Date();
        mem.reports.unshift(doc);
        return doc;
      } finally {
        mem.pendingReportIds.delete(reportId);
      }
    }

    // Complete first-use onboarding before opening the domain transaction;
    // nested MongoDB transactions are not safe or supported.
    await ensureMongoSeeded();
    // Report, patient summary, and initial collection must commit together.
    // A valid patient ID belonging to another account remains indistinguishable
    // from a missing record because every query is tenant-scoped.
    try {
      return await mongoTransaction(async (session) => {
        const ownPatient = await Patient.findOne(byIdOrPid(String(patient))).session(session).lean();
        if (!ownPatient) throw Object.assign(new Error('Patient not found'), { status: 404 });
        const created = (await Report.create([{ ...payload, patient: ownPatient._id }], { session }))[0];
        const updatedPatient = await Patient.findOneAndUpdate(
          { _id: ownPatient._id },
          { $set: { lastTest: payload.test, lastTestDate: payload.date } },
          { session, runValidators: true },
        );
        if (!updatedPatient) throw Object.assign(new Error('Patient not found'), { status: 404 });
        await initialLedgerEntry(created, ownPatient, { session });
        return {
          ...created.toObject(),
          patient: { ...ownPatient, lastTest: payload.test, lastTestDate: payload.date },
        };
      }, 'Atomic report creation requires a transaction-capable MongoDB deployment');
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.reportId) {
        badRequest('A report with this report ID already exists');
      }
      throw error;
    }
  },

  async update(id, patch) {
    ensureSeeded();
    const source = patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {};
    if (['paid', 'amount', 'discount', 'paidAmount', 'pendingAmount', 'paymentMode', 'transactionId']
      .some((field) => source[field] !== undefined)) {
      badRequest('Report billing fields are immutable; use the payment collection endpoint for collections');
    }
    if (['doctor', 'doctorId', 'commission', 'commissionRate', 'commissionPaid']
      .some((field) => source[field] !== undefined)) {
      badRequest('Report doctor and commission fields are immutable');
    }
    if (['verified', 'verifiedBy'].some((field) => source[field] !== undefined)) {
      badRequest('Report verification fields are server-managed; use the verification endpoint');
    }
    const allowed = {};
    REPORT_FIELDS.forEach((k) => {
      if (source[k] !== undefined) allowed[k] = source[k];
    });
    if (allowed.status !== undefined && !['Pending', 'Completed', 'Cancelled'].includes(allowed.status)) {
      badRequest('Report status is invalid');
    }
    if (allowed.test !== undefined) {
      allowed.test = String(allowed.test).trim();
      if (!allowed.test) badRequest('Report test is required');
    }
    if (useMemory()) {
      const r = mem.reports.find((x) => x._id === id || x.reportId === id);
      if (!r) {
        const err = new Error('Report not found');
        err.status = 404;
        throw err;
      }
      Object.assign(r, allowed, { updatedAt: new Date() });
      return r;
    }
    const r = await Report.findOneAndUpdate(
      byIdOrPid(id),
      { $set: allowed },
      { new: true, runValidators: true },
    ).populate('patient').lean();
    if (!r) {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    return r;
  },

  /** Owner verification step from the workflow (optional but tracked). */
  async verify(id) {
    const verifiedBy = String(currentTenant()?.name || 'Lab Owner').trim() || 'Lab Owner';
    if (useMemory()) {
      const report = mem.reports.find((item) => item._id === id || item.reportId === id);
      if (!report) throw Object.assign(new Error('Report not found'), { status: 404 });
      Object.assign(report, {
        verified: true,
        verifiedBy,
        status: 'Completed',
        updatedAt: new Date(),
      });
      return report;
    }
    const report = await Report.findOneAndUpdate(
      byIdOrPid(id),
      { $set: { verified: true, verifiedBy, status: 'Completed' } },
      { new: true, runValidators: true },
    ).populate('patient').lean();
    if (!report) throw Object.assign(new Error('Report not found'), { status: 404 });
    return report;
  },

  /** "Duplicate" action from the report history screen. */
  async duplicate(id) {
    const src = await reports.getById(id);
    const patientId = String(src.patient?._id || src.patient);
    let currentDoctorName = src.doctor;
    if (src.doctorId) {
      currentDoctorName = (await meta.doctors.get(String(src.doctorId))).name;
    }
    const copy = {
      reportId: await reports.nextReportId(),
      patient: patientId,
      test: src.test,
      doctor: currentDoctorName,
      amount: num(src.amount),
      discount: num(src.discount),
      paidAmount: 0,
      pendingAmount: num(src.amount),
      paymentMode: src.paymentMode || 'Cash',
      paid: false,
      status: 'Pending',
      technician: src.technician || '',
      sampleDate: `${dateLabel()}  ${timeLabel()}`,
      reportDate: `${dateLabel()}  ${timeLabel()}`,
      values: (src.values || []).map((v) => ({ ...v, value: '', flag: '' })),
      remarks: '',
      color: src.color,
    };
    return reports.create(copy);
  },

  async remove(id) {
    ensureSeeded();
    if (useMemory()) {
      const i = mem.reports.findIndex((x) => x._id === id || x.reportId === id);
      if (i < 0) {
        const err = new Error('Report not found');
        err.status = 404;
        throw err;
      }
      const [removed] = mem.reports.splice(i, 1);
      mem.deleted.unshift({ ...removed, kind: 'reports', deletedAt: new Date() });
      return removed;
    }
    return mongoTransaction(async (session) => {
      const r = await Report.findOneAndDelete(byIdOrPid(id)).session(session).lean();
      if (!r) {
        const err = new Error('Report not found');
        err.status = 404;
        throw err;
      }
      const patient = await Patient.findOne({ _id: r.patient }).session(session).lean();
      if (!patient) badRequest('The report patient is unavailable');
      await Meta.create([{
        kind: 'deleted',
        data: {
          ...r,
          patient: { _id: String(patient._id), pid: patient.pid },
          kind: 'reports',
          deletedAt: new Date(),
        },
      }], { session });
      return r;
    }, 'Atomic report deletion requires a transaction-capable MongoDB deployment');
  },

  async stats() {
    const list = await allReports();
    const start = startOfToday();
    const today = list.filter((r) => new Date(r.createdAt) >= start);
    const pending = list.filter((r) => r.status === 'Pending');
    const completed = list.filter((r) => r.status === 'Completed');
    const todayRev = today.reduce((s, r) => s + num(r.amount), 0);
    return [
      { label: "Today's Reports", value: fmt(today.length), tone: 'primary' },
      { label: 'Pending Reports', value: fmt(pending.length), tone: 'orange' },
      { label: 'Completed', value: fmt(completed.length), tone: 'green' },
      { label: "Today's Collection", value: inr(todayRev), tone: 'purple' },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Master data collections                                             */
/* ------------------------------------------------------------------ */

function masterDataPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) badRequest('Record data must be an object');
  const out = Object.fromEntries(Object.entries(data).map(([field, value]) => [
    field, typeof value === 'string' ? value.trim() : value,
  ]));
  ['_id', 'id', 'ownerId', 'kind', 'createdAt', 'updatedAt', 'deletedAt'].forEach((field) => delete out[field]);
  return out;
}

function collectionApi(key, required = []) {
  return {
    async list(query = {}) {
      let list = await all(key);
      const search = String(query.q || query.search || '').trim().toLocaleLowerCase('en-IN').slice(0, 100);
      if (search) {
        list = list.filter((record) => Object.values(record).some((value) => (
          typeof value === 'string' || typeof value === 'number'
        ) && String(value).toLocaleLowerCase('en-IN').includes(search)));
      }
      return paged(list, query);
    },
    async get(id) {
      const list = await all(key);
      const found = list.find((x) => String(x._id) === String(id) || String(x.id) === String(id));
      if (!found) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      return found;
    },
    async create(data, options = {}) {
      ensureSeeded();
      const payload = masterDataPayload(data);
      for (const f of required) {
        if (payload[f] == null || payload[f] === '') {
          const err = new Error(`${f} is required`);
          err.status = 400;
          throw err;
        }
      }
      if (useMemory()) {
        const doc = { ...payload, _id: makeId(), createdAt: new Date(), updatedAt: new Date() };
        doc.id = doc._id;
        mem[key].unshift(doc);
        return doc;
      }
      // Domain workflows may already be inside a transaction; they perform
      // onboarding before opening it to avoid nesting MongoDB transactions.
      if (!options.session) await ensureMongoSeeded();
      const document = { kind: key, data: payload };
      const created = options.session
        ? (await Meta.create([document], { session: options.session }))[0]
        : await Meta.create(document);
      return { ...created.data, _id: String(created._id), id: String(created._id) };
    },
    async update(id, patch, options = {}) {
      ensureSeeded();
      const payload = masterDataPayload(patch);
      if (useMemory()) {
        const item = mem[key].find((x) => String(x._id) === String(id) || String(x.id) === String(id));
        if (!item) {
          const err = new Error('Not found');
          err.status = 404;
          throw err;
        }
        Object.assign(item, payload, { updatedAt: new Date() });
        return item;
      }
      const query = Meta.findOne({ _id: id, kind: key });
      if (options.session) query.session(options.session);
      const doc = await query;
      if (!doc) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      doc.data = { ...doc.data, ...payload };
      doc.markModified('data');
      await doc.save(options.session ? { session: options.session } : undefined);
      return { ...doc.data, _id: String(doc._id), id: String(doc._id) };
    },
    async remove(id) {
      ensureSeeded();
      if (useMemory()) {
        const i = mem[key].findIndex((x) => String(x._id) === String(id) || String(x.id) === String(id));
        if (i < 0) {
          const err = new Error('Not found');
          err.status = 404;
          throw err;
        }
        const removed = mem[key][i];
        if (key === 'doctors') {
          const hasReports = mem.reports.some((report) => (report.doctorId && report.doctorId === removed._id)
            || (!report.doctorId && report.doctor === removed.name));
          const hasPayouts = (mem.commissions || []).some((payout) => (payout.doctorId && payout.doctorId === removed._id)
            || (!payout.doctorId && payout.doctor === removed.name));
          if (hasReports || hasPayouts) {
            throw Object.assign(new Error('This doctor has report or commission history and cannot be deleted'), { status: 409 });
          }
        }
        mem[key].splice(i, 1);
        mem.deleted.unshift({ ...removed, kind: key, deletedAt: new Date() });
        return removed;
      }
      return mongoTransaction(async (session) => {
        const doc = await Meta.findOne({ _id: id, kind: key }).session(session);
        if (!doc) {
          const err = new Error('Not found');
          err.status = 404;
          throw err;
        }
        if (key === 'doctors') {
          const doctorId = String(doc._id);
          const doctorName = String(doc.data?.name || '');
          const reportReference = await Report.exists({
            $or: [{ doctorId: doc._id }, { doctorId: null, doctor: doctorName }],
          }).session(session);
          const payoutReference = await Meta.exists({
            kind: 'commissions',
            $or: [
              { 'data.doctorId': doctorId },
              { 'data.doctorId': { $in: [null, ''] }, 'data.doctor': doctorName },
            ],
          }).session(session);
          if (reportReference || payoutReference) {
            throw Object.assign(new Error('This doctor has report or commission history and cannot be deleted'), { status: 409 });
          }
        }
        const deleted = await Meta.deleteOne({ _id: doc._id, kind: key }).session(session);
        if (deleted.deletedCount !== 1) throw Object.assign(new Error('Not found'), { status: 404 });
        await Meta.create([{
          kind: 'deleted', data: { ...doc.data, kind: key, deletedAt: new Date() },
        }], { session });
        return { ...doc.data, _id: String(doc._id) };
      }, 'Atomic record deletion requires a transaction-capable MongoDB deployment');
    },
  };
}

function withNumericValidation(api, field, label, { positive = false, max = null } = {}) {
  const normalize = (data = {}, requireValue = false) => {
    const out = data && typeof data === 'object' && !Array.isArray(data) ? { ...data } : {};
    if (out[field] === undefined && !requireValue) return out;
    const value = money(out[field], label);
    if (positive && value <= 0) badRequest(`${label} must be positive`);
    if (max !== null && value > max) badRequest(`${label} cannot exceed ${max}`);
    out[field] = value;
    return out;
  };
  const baseCreate = api.create;
  const baseUpdate = api.update;
  api.create = (data = {}, options = {}) => baseCreate(normalize(data, true), options);
  api.update = (id, patch = {}) => baseUpdate(id, normalize(patch));
  return api;
}

// Doctors get the .env default commission (DEFAULT_COMMISSION_PERCENT) when
// they are created without an explicit commission percentage.
const doctorsApi = collectionApi('doctors', ['name']);
const baseDoctorCreate = doctorsApi.create;
const baseDoctorUpdate = doctorsApi.update;

function normalizeDoctor(data = {}, requireName = false) {
  const doctor = { ...data };
  if (doctor.name !== undefined || requireName) {
    doctor.name = String(doctor.name || '').trim();
    if (!doctor.name) badRequest('Doctor name is required');
  }
  if (doctor.commission === undefined && requireName) doctor.commission = cfg.defaultCommissionPercent;
  if (doctor.commission !== undefined) {
    doctor.commission = money(doctor.commission, 'Commission percentage');
    if (doctor.commission > 100) badRequest('Commission percentage cannot exceed 100');
  }
  return doctor;
}

function sameDoctorName(left, right) {
  return String(left || '').trim().toLocaleLowerCase('en-IN')
    === String(right || '').trim().toLocaleLowerCase('en-IN');
}

function doctorNameRegex(name) {
  return new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

async function lockDoctorNames(session) {
  const account = await User.findOneAndUpdate(
    { _id: requireTenantId() },
    { $set: { updatedAt: new Date() } },
    { new: true, session },
  );
  if (!account) throw Object.assign(new Error('Account not found'), { status: 401 });
}

doctorsApi.create = async (data = {}, options = {}) => {
  const doctor = normalizeDoctor(data, true);
  if (useMemory()) {
    ensureSeeded();
    if (mem.doctors.some((item) => sameDoctorName(item.name, doctor.name))) {
      badRequest('A doctor with this name already exists');
    }
    return baseDoctorCreate(doctor, options);
  }
  await ensureMongoSeeded();
  const create = async (session) => {
    await lockDoctorNames(session);
    const duplicate = await Meta.exists({ kind: 'doctors', 'data.name': doctorNameRegex(doctor.name) }).session(session);
    if (duplicate) badRequest('A doctor with this name already exists');
    return baseDoctorCreate(doctor, { session });
  };
  return options.session
    ? create(options.session)
    : mongoTransaction(create, 'Atomic doctor creation requires a transaction-capable MongoDB deployment');
};

doctorsApi.update = async (id, patch = {}, options = {}) => {
  const doctor = normalizeDoctor(patch);
  if (!doctor.name) return baseDoctorUpdate(id, doctor, options);
  if (useMemory()) {
    ensureSeeded();
    if (mem.doctors.some((item) => String(item._id) !== String(id)
      && String(item.id) !== String(id) && sameDoctorName(item.name, doctor.name))) {
      badRequest('A doctor with this name already exists');
    }
    return baseDoctorUpdate(id, doctor, options);
  }
  await ensureMongoSeeded();
  const update = async (session) => {
    await lockDoctorNames(session);
    const duplicate = await Meta.exists({
      _id: { $ne: id },
      kind: 'doctors',
      'data.name': doctorNameRegex(doctor.name),
    }).session(session);
    if (duplicate) badRequest('A doctor with this name already exists');
    return baseDoctorUpdate(id, doctor, { session });
  };
  return options.session
    ? update(options.session)
    : mongoTransaction(update, 'Atomic doctor update requires a transaction-capable MongoDB deployment');
};

const discountsApi = collectionApi('discounts', ['name', 'type', 'mode', 'value']);
const baseDiscountCreate = discountsApi.create;
const baseDiscountUpdate = discountsApi.update;

function normalizeDiscount(data = {}, current = {}) {
  const adjustment = masterDataPayload(data);
  const type = adjustment.type ?? current.type;
  const mode = adjustment.mode ?? current.mode;
  if (adjustment.type !== undefined && !['Discount', 'Charge'].includes(adjustment.type)) {
    badRequest('Adjustment type must be Discount or Charge');
  }
  if (adjustment.mode !== undefined && !['Percentage', 'Fixed'].includes(adjustment.mode)) {
    badRequest('Calculation must be Percentage or Fixed');
  }
  if (adjustment.value !== undefined) {
    adjustment.value = money(adjustment.value, 'Adjustment value');
    if (mode === 'Percentage' && adjustment.value > 100) badRequest('Percentage adjustments cannot exceed 100');
  }
  if (adjustment.status !== undefined && !['Active', 'Inactive'].includes(adjustment.status)) {
    badRequest('Status must be Active or Inactive');
  }
  return { adjustment, type, mode };
}

discountsApi.create = (data = {}, options = {}) => {
  const { adjustment, type, mode } = normalizeDiscount(data);
  if (!type || !mode) badRequest('Adjustment type and calculation are required');
  return baseDiscountCreate(adjustment, options);
};
discountsApi.update = async (id, patch = {}, options = {}) => {
  const current = await discountsApi.get(id);
  const { adjustment } = normalizeDiscount(patch, current);
  return baseDiscountUpdate(id, adjustment, options);
};

const meta = {
  tests: withNumericValidation(collectionApi('tests', ['name', 'price']), 'price', 'Test price'),
  doctors: doctorsApi,
  employees: collectionApi('employees', ['name', 'role']),
  centers: collectionApi('centers', ['name']),
  payments: collectionApi('payments', ['name']),
  discounts: discountsApi,
  templates: collectionApi('templates', ['name']),
  packages: withNumericValidation(collectionApi('packages', ['name', 'price']), 'price', 'Package price'),
  expenses: withNumericValidation(collectionApi('expenses', ['name', 'amount']), 'amount', 'Expense amount', { positive: true }),
  transactions: withNumericValidation(collectionApi('transactions', ['amount']), 'amount', 'Payment amount', { positive: true }),
  commissions: withNumericValidation(collectionApi('commissions', ['doctor', 'amount']), 'amount', 'Commission amount', { positive: true }),
  drafts: collectionApi('drafts', []),
  labs: collectionApi('labs', ['name']),
  roles: collectionApi('roles', ['name']),

  async deleted(query = {}) {
    ensureSeeded();
    let list;
    if (useMemory()) list = [...mem.deleted];
    else {
      const docs = await Meta.find({ kind: 'deleted' }).sort({ createdAt: -1 }).lean();
      list = docs.map((d) => ({ ...d.data, _id: String(d._id) }));
    }
    const category = String(query.kind || '').trim();
    if (category === 'patients' || category === 'reports') list = list.filter((record) => record.kind === category);
    if (category === 'other') list = list.filter((record) => !['patients', 'reports'].includes(record.kind));
    const search = String(query.q || query.search || '').trim().toLocaleLowerCase('en-IN').slice(0, 100);
    if (search) {
      list = list.filter((record) => Object.values(record).some((value) => (
        typeof value === 'string' || typeof value === 'number'
      ) && String(value).toLocaleLowerCase('en-IN').includes(search)));
    }
    return paged(list, query);
  },

  /** Restore a soft-deleted record back into its collection. */
  async restore(id) {
    ensureSeeded();
    if (useMemory()) {
      const i = mem.deleted.findIndex((x) => String(x._id) === String(id));
      if (i < 0) {
        const err = new Error('Deleted record not found');
        err.status = 404;
        throw err;
      }
      const rec = mem.deleted[i];
      const { kind, deletedAt, ...rest } = rec;
      let restored;
      if (kind === 'patients') {
        const patient = { ...patientPatch(rest, true), pid: String(rest.pid || '').trim() };
        if (!patient.pid) badRequest('Deleted patient is invalid');
        if (mem.patients.some((item) => item.pid === patient.pid || item.mobile === patient.mobile)) {
          badRequest('A matching patient already exists');
        }
        restored = { ...patient, _id: rest._id, createdAt: rest.createdAt, updatedAt: new Date() };
      } else if (kind === 'reports') {
        if (mem.reports.some((item) => item.reportId === rest.reportId)) badRequest('A matching report already exists');
        const keys = new Set(reportPatientKeys(rest.patient));
        const ownPatient = mem.patients.find((item) => (
          [item._id, item.id, item.pid].filter(Boolean).some((key) => keys.has(String(key)))
        ));
        if (!ownPatient) badRequest('The report patient must be restored first');
        restored = { ...rest, patient: ownPatient, updatedAt: new Date() };
      } else if (COLLECTIONS.includes(kind)) {
        restored = { ...rest, updatedAt: new Date() };
      } else {
        badRequest('Deleted record type is invalid');
      }
      mem.deleted.splice(i, 1);
      if (kind === 'patients') mem.patients.unshift(restored);
      else if (kind === 'reports') mem.reports.unshift(restored);
      else mem[kind].unshift(restored);
      return restored;
    }
    return mongoTransaction(async (session) => {
      const doc = await Meta.findById(id).session(session);
      if (!doc) {
        const err = new Error('Deleted record not found');
        err.status = 404;
        throw err;
      }
      const { kind, deletedAt, _id, ownerId, ...rest } = doc.data || {}; // eslint-disable-line no-unused-vars
      if (kind === 'patients') {
        await Patient.create([rest], { session });
      } else if (kind === 'reports') {
        const patientKeys = reportPatientKeys(rest.patient);
        const patientFilters = patientKeys.flatMap((key) => [
          { pid: key },
          ...(mongoose.isValidObjectId(key) ? [{ _id: key }] : []),
        ]);
        const ownPatient = patientFilters.length
          ? await Patient.findOne({ $or: patientFilters }).session(session).lean()
          : null;
        if (!ownPatient) badRequest('The report patient must be restored first');
        await Report.create([{ ...rest, patient: ownPatient._id }], { session });
      } else if (COLLECTIONS.includes(kind)) {
        await Meta.create([{ kind, data: rest }], { session });
      } else {
        badRequest('Deleted record type is invalid');
      }
      await doc.deleteOne({ session });
      return rest;
    }, 'Atomic deleted-record restoration requires a transaction-capable MongoDB deployment');
  },

  async lab() {
    return settings.get();
  },
  async updateLab(data) {
    return settings.update(data);
  },
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const settings = {
  async get() {
    ensureSeeded();
    if (useMemory()) return { ...(mem.settings || defaultSettings()) };
    await ensureMongoSeeded();
    const doc = await Meta.findOne({ kind: 'settings' }).sort({ updatedAt: -1 });
    return { ...defaultSettings(), ...(doc?.data || {}) };
  },
  async update(patch) {
    ensureSeeded();
    if (useMemory()) {
      mem.settings = { ...(mem.settings || defaultSettings()), ...(patch || {}) };
      return { ...mem.settings };
    }
    await ensureMongoSeeded();
    return mongoTransaction(async (session) => {
      const account = await User.findOneAndUpdate(
        { _id: requireTenantId() },
        { $set: { updatedAt: new Date() } },
        { new: true, session },
      ).lean();
      if (!account) throw Object.assign(new Error('Settings account is unavailable'), { status: 503 });
      const doc = (await Meta.findOne({ kind: 'settings' })
        .sort({ updatedAt: -1 }).session(session))
        || new Meta({ kind: 'settings', data: defaultSettings() });
      doc.data = { ...defaultSettings(), ...(doc.data || {}), ...(patch || {}) };
      doc.markModified('data');
      await doc.save({ session });
      return { ...doc.data };
    }, 'Atomic settings updates require a transaction-capable MongoDB deployment');
  },
};

/* ------------------------------------------------------------------ */
/* Payment ledger (transactions)                                       */
/* ------------------------------------------------------------------ */

const transactions = {
  async list(query = {}) {
    const list = await all('transactions');
    let out = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (query.mode) out = out.filter((t) => t.mode === query.mode);
    if (query.type) out = out.filter((t) => t.type === query.type);
    if (query.reportId) out = out.filter((t) => t.reportId === query.reportId);
    return out;
  },

  async create(data, options = {}) {
    const amount = money(data?.amount, 'Payment amount');
    if (amount <= 0) badRequest('A positive payment amount is required');
    return meta.transactions.create({
      txnId: `TXN${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      reportId: data.reportId || '',
      report: data.report || '',
      patient: data.patient || '',
      patientId: data.patientId || '',
      amount,
      mode: data.mode || 'Cash',
      type: data.type || 'Collection',
      note: data.note || '',
      date: data.date || dateLabel(),
      time: timeLabel(),
    }, options);
  },

  /** Collect a pending amount and its ledger entry as one atomic mutation. */
  async collect({ reportId, amount, mode, note }) {
    if (!reportId) badRequest('Report is required');
    const requested = amount === undefined || amount === null || amount === ''
      ? null
      : money(amount, 'Payment amount');
    if (requested !== null && requested <= 0) badRequest('A positive payment amount is required');

    const applyPayment = async (report, options = {}) => {
      // Derive the authoritative balance from amount - paidAmount rather than
      // trusting a stale legacy pendingAmount field.
      const pending = Math.max(0, num(report.amount) - num(report.paidAmount));
      if (pending <= 0) badRequest('This report has no pending amount');
      const pay = Math.min(requested ?? pending, pending);
      const paidAmount = num(report.paidAmount) + pay;
      const pendingAmount = Math.max(0, num(report.amount) - paidAmount);
      report.paidAmount = paidAmount;
      report.pendingAmount = pendingAmount;
      report.paid = pendingAmount === 0;
      report.paymentMode = mode || report.paymentMode;
      report.updatedAt = new Date();
      const txn = await transactions.create({
        reportId: report.reportId,
        report: String(report._id),
        patient: report.patient?.name,
        patientId: String(report.patient?._id || ''),
        amount: pay,
        mode: mode || report.paymentMode || 'Cash',
        type: 'Collection',
        note: note || 'Pending amount collected',
      }, options);
      return { pay, paidAmount, pendingAmount, txn };
    };

    if (useMemory()) {
      const report = await reports.getById(reportId);
      // No await occurs between reading and applying the balance, so concurrent
      // in-memory requests cannot both collect the same pending rupees.
      const before = pick(report, ['paidAmount', 'pendingAmount', 'paid', 'paymentMode', 'updatedAt']);
      try {
        const result = await applyPayment(report);
        return { report, transaction: result.txn };
      } catch (error) {
        Object.assign(report, before);
        throw error;
      }
    }

    await ensureMongoSeeded();
    return mongoTransaction(async (session) => {
      const report = await Report.findOne(byIdOrPid(reportId)).session(session).populate('patient');
      if (!report) throw Object.assign(new Error('Report not found'), { status: 404 });
      const result = await applyPayment(report, { session });
      await report.save({ session, validateModifiedOnly: true });
      return { report: report.toObject(), transaction: result.txn };
    }, 'Atomic payment collection requires a transaction-capable MongoDB deployment');
  },

  async summary() {
    const list = await transactions.list();
    const reportList = await allReports();
    const start = startOfToday();
    const today = list.filter((t) => new Date(t.createdAt) >= start && t.type === 'Collection');
    const collected = list.filter((t) => t.type === 'Collection').reduce((s, t) => s + num(t.amount), 0);
    const pending = reportList.reduce((s, r) => s + num(r.pendingAmount ?? (r.paid ? 0 : r.amount)), 0);
    const byMode = {};
    list.filter((t) => t.type === 'Collection').forEach((t) => {
      byMode[t.mode || 'Cash'] = (byMode[t.mode || 'Cash'] || 0) + num(t.amount);
    });
    return {
      todayCollection: today.reduce((s, t) => s + num(t.amount), 0),
      totalCollection: collected,
      pendingAmount: pending,
      transactions: list.length,
      byMode: Object.entries(byMode).map(([mode, amount]) => ({ mode, amount })),
    };
  },
};

/* ------------------------------------------------------------------ */
/* Online payments (Razorpay)                                          */
/* ------------------------------------------------------------------ */

const payments = {
  /**
   * Create a Razorpay order for an online payment. The app then opens the
   * checkout against this order; the secret key never leaves the server.
   */
  async order({ amount, receipt, notes }) {
    await db.whenReady();
    const inrAmount = money(amount, 'Payment amount');
    if (inrAmount <= 0) badRequest('A positive payment amount is required');
    if (!razorpay.configured()) throw Object.assign(new Error('Online payments are not configured'), { status: 503 });
    const order = await razorpay.createOrder({
      amount: Math.round(inrAmount * 100),
      receipt: String(receipt || `rcpt_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`),
      notes: notes && typeof notes === 'object' ? notes : {},
    });
    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt,
      keyId: razorpay.keyId(),
    };
  },

  /**
   * Verify a completed checkout: validate the HMAC signature, then confirm the
   * captured amount/status with Razorpay (never trust the client). When a
   * `reportId` is supplied, the captured amount is collected against it.
   */
  async verify({ orderId, paymentId, signature, reportId, mode }) {
    await db.whenReady();
    if (!razorpay.configured()) throw Object.assign(new Error('Online payments are not configured'), { status: 503 });
    if (!orderId || !paymentId || !signature) badRequest('Order, payment and signature are required');
    if (!razorpay.verifySignature({ orderId, paymentId, signature })) {
      throw Object.assign(new Error('Payment verification failed'), { status: 400 });
    }
    const [order, payment] = await Promise.all([
      razorpay.fetchOrder(orderId),
      razorpay.fetchPayment(paymentId),
    ]);
    if (payment.status !== 'captured') {
      throw Object.assign(new Error('Payment has not been captured'), { status: 400 });
    }
    const amountInr = Number(order.amount) / 100;
    const note = `Razorpay ${paymentId}`;
    const upiMode = ['PhonePe', 'Google Pay', 'Paytm', 'UPI'].includes(mode) ? mode : 'UPI';
    if (reportId) {
      const result = await transactions.collect({ reportId, amount: amountInr, mode: upiMode, note });
      return { ok: true, orderId, paymentId, amount: amountInr, mode: upiMode, report: result.report };
    }
    return { ok: true, orderId, paymentId, amount: amountInr, mode: upiMode };
  },
};

/* ------------------------------------------------------------------ */
/* Doctors — ledger & commission                                       */
/* ------------------------------------------------------------------ */

function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1, 2)}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function belongsToDoctor(record, doctor) {
  const recordDoctorId = String(record?.doctorId || '');
  const doctorId = String(doctor?._id || doctor?.id || '');
  return recordDoctorId
    ? Boolean(doctorId) && recordDoctorId === doctorId
    : String(record?.doctor || '') === String(doctor?.name || '');
}

const doctors = {
  async list() {
    const list = await all('doctors');
    const reportList = await allReports();
    const payouts = await all('commissions');
    return list.map((d) => {
      const rs = reportList.filter((report) => belongsToDoctor(report, d));
      const earned = rs.reduce(
        (sum, report) => sum + num(report.commission ?? Math.round((num(report.amount) * num(d.commission)) / 100)),
        0,
      );
      const paid = payouts.filter((payout) => belongsToDoctor(payout, d)).reduce((s, p) => s + num(p.amount), 0);
      return {
        ...d,
        totalReports: rs.length,
        totalBusiness: rs.reduce((s, r) => s + num(r.amount), 0),
        totalCommission: earned,
        paidCommission: paid,
        pendingCommission: Math.max(0, earned - paid),
      };
    });
  },

  async ledger(id) {
    const doctor = await meta.doctors.get(id);
    const reportList = await allReports();
    const payouts = (await all('commissions')).filter((payout) => belongsToDoctor(payout, doctor));
    const rs = reportList.filter((report) => belongsToDoctor(report, doctor));
    const rate = num(doctor.commission);

    const monthly = new Map();
    rs.forEach((r) => {
      const key = monthKey(r.createdAt || Date.now());
      const cur = monthly.get(key) || { key, label: monthLabel(key), reports: 0, business: 0, commission: 0 };
      cur.reports += 1;
      cur.business += num(r.amount);
      cur.commission += num(r.commission ?? Math.round((num(r.amount) * rate) / 100));
      monthly.set(key, cur);
    });

    const totalCommission = rs.reduce(
      (sum, report) => sum + num(report.commission ?? Math.round((num(report.amount) * rate) / 100)),
      0,
    );
    const paidCommission = payouts.reduce((s, p) => s + num(p.amount), 0);

    return {
      doctor,
      totalReports: rs.length,
      totalBusiness: rs.reduce((s, r) => s + num(r.amount), 0),
      totalCommission,
      paidCommission,
      pendingCommission: Math.max(0, totalCommission - paidCommission),
      monthly: Array.from(monthly.values()).sort((a, b) => (a.key < b.key ? 1 : -1)),
      reports: rs.slice(0, 50).map((r) => ({
        _id: String(r._id),
        reportId: r.reportId,
        patient: r.patient?.name || '',
        test: r.test,
        date: r.date,
        amount: num(r.amount),
        commission: num(r.commission ?? Math.round((num(r.amount) * rate) / 100)),
      })),
      payouts,
    };
  },
};

const commissions = {
  async list() {
    return (await all('commissions')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /** Aggregated wallet view across every referring doctor. */
  async summary() {
    const list = await doctors.list();
    return {
      doctors: list,
      totalCommission: list.reduce((s, d) => s + d.totalCommission, 0),
      paidCommission: list.reduce((s, d) => s + d.paidCommission, 0),
      pendingCommission: list.reduce((s, d) => s + d.pendingCommission, 0),
    };
  },

  async pay({ doctor, doctorId, amount, mode, note }) {
    const suppliedName = String(doctor || '').trim();
    const payoutAmount = money(amount, 'Commission amount');
    if (payoutAmount <= 0) badRequest('A positive commission amount is required');

    const finishPayout = async (ownDoctor, pendingCommission, options = {}) => {
      if (suppliedName && suppliedName !== ownDoctor.name) badRequest('Doctor details do not match');
      if (payoutAmount > pendingCommission) badRequest('Commission amount exceeds the pending balance');
      const payoutData = {
        doctor: ownDoctor.name,
        doctorId: String(ownDoctor._id || ownDoctor.id || ''),
        amount: payoutAmount,
        mode: mode || 'Cash',
        note: note || 'Commission payout',
        date: dateLabel(),
        time: timeLabel(),
      };
      const payout = await meta.commissions.create(payoutData, options);
      try {
        await transactions.create({
          amount: payoutAmount,
          mode: mode || 'Cash',
          type: 'Commission Payout',
          note: `Commission paid to ${ownDoctor.name}`,
          patient: ownDoctor.name,
        }, options);
        return payout;
      } catch (error) {
        if (useMemory()) {
          const index = mem.commissions.findIndex((item) => item._id === payout._id);
          if (index >= 0) mem.commissions.splice(index, 1);
        }
        throw error;
      }
    };

    if (useMemory()) {
      ensureSeeded();
      // Keep this calculation synchronous until create() inserts the payout;
      // concurrent in-memory requests therefore observe the first deduction.
      const ownDoctor = mem.doctors.find((item) => (
        doctorId
          ? String(item._id) === String(doctorId) || String(item.id) === String(doctorId)
          : item.name === suppliedName
      ));
      if (!ownDoctor) throw Object.assign(new Error('Doctor not found'), { status: 404 });
      const earned = mem.reports.filter((report) => belongsToDoctor(report, ownDoctor))
        .reduce((sum, report) => sum + num(report.commission), 0);
      const paid = mem.commissions.filter((item) => belongsToDoctor(item, ownDoctor))
        .reduce((sum, item) => sum + num(item.amount), 0);
      return finishPayout(ownDoctor, Math.max(0, earned - paid));
    }

    await ensureMongoSeeded();
    return mongoTransaction(async (session) => {
      const doctorFilter = doctorId
        ? { _id: doctorId, kind: 'doctors' }
        : { kind: 'doctors', 'data.name': suppliedName };
      const doctorDoc = await Meta.findOneAndUpdate(
        doctorFilter,
        { $set: { updatedAt: new Date() } },
        { new: true, session },
      ).lean();
      if (!doctorDoc) throw Object.assign(new Error('Doctor not found'), { status: 404 });
      const ownDoctor = { ...doctorDoc.data, _id: String(doctorDoc._id), id: String(doctorDoc._id) };
      if (suppliedName && suppliedName !== ownDoctor.name) badRequest('Doctor details do not match');

      // Updating the doctor above provides a shared write-conflict point. If
      // two payouts race, MongoDB retries one transaction against the newly
      // committed payout before this balance is accepted.
      const reportDocs = await Report.find({
        $or: [
          { doctorId: doctorDoc._id },
          { doctorId: null, doctor: ownDoctor.name },
        ],
      }).session(session).lean();
      const payoutDocs = await Meta.find({
        kind: 'commissions',
        $or: [
          { 'data.doctorId': String(doctorDoc._id) },
          { 'data.doctorId': { $in: [null, ''] }, 'data.doctor': ownDoctor.name },
        ],
      }).session(session).lean();
      const earned = reportDocs.reduce((sum, report) => sum + num(report.commission), 0);
      const paid = payoutDocs.reduce((sum, item) => sum + num(item.data?.amount), 0);
      return finishPayout(ownDoctor, Math.max(0, earned - paid), { session });
    }, 'Atomic commission payout requires a transaction-capable MongoDB deployment');
  },
};

/* ------------------------------------------------------------------ */
/* Expenses                                                            */
/* ------------------------------------------------------------------ */

const expenses = {
  categories: () => defaults.EXPENSE_CATEGORIES,

  async summary() {
    const list = await all('expenses');
    const start = startOfToday();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const byCategory = {};
    list.forEach((e) => {
      const c = e.category || 'Other';
      byCategory[c] = (byCategory[c] || 0) + num(e.amount);
    });

    const monthly = new Map();
    list.forEach((e) => {
      const key = monthKey(e.createdAt || Date.now());
      const cur = monthly.get(key) || { key, label: monthLabel(key), amount: 0, count: 0 };
      cur.amount += num(e.amount);
      cur.count += 1;
      monthly.set(key, cur);
    });

    return {
      total: list.reduce((s, e) => s + num(e.amount), 0),
      today: list.filter((e) => new Date(e.createdAt) >= start).reduce((s, e) => s + num(e.amount), 0),
      thisMonth: list.filter((e) => new Date(e.createdAt) >= monthStart).reduce((s, e) => s + num(e.amount), 0),
      count: list.length,
      byCategory: Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      monthly: Array.from(monthly.values()).sort((a, b) => (a.key < b.key ? 1 : -1)),
      categories: defaults.EXPENSE_CATEGORIES,
    };
  },
};

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const dashboard = {
  async stats() {
    const list = await allReports();
    const expenseList = await all('expenses');
    const payouts = await all('commissions');
    const start = startOfToday();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const today = list.filter((r) => new Date(r.createdAt) >= start);
    const todayRevenue = today.reduce((s, r) => s + num(r.amount), 0);
    const monthRevenue = list
      .filter((r) => new Date(r.createdAt) >= monthStart)
      .reduce((s, r) => s + num(r.amount), 0);
    const pending = list.filter((r) => r.status === 'Pending');
    const pendingAmount = list.reduce((s, r) => s + num(r.pendingAmount ?? (r.paid ? 0 : r.amount)), 0);
    const pendingPatients = new Set(
      list.filter((r) => num(r.pendingAmount ?? (r.paid ? 0 : r.amount)) > 0)
        .map((r) => String(r.patient?._id || r.patient || r.reportId))
    ).size;

    const wallet = await commissions.summary();
    const paidCommission = payouts.reduce((s, p) => s + num(p.amount), 0);
    const pendingCommission = wallet.pendingCommission;

    const expenseToday = expenseList
      .filter((e) => new Date(e.createdAt) >= start)
      .reduce((s, e) => s + num(e.amount), 0);
    const expenseTotal = expenseList.reduce((s, e) => s + num(e.amount), 0);
    const totalRevenue = list.reduce((s, r) => s + num(r.amount), 0);

    return [
      { key: 'reports', label: "Today's Reports", value: fmt(today.length), sub: `Total: ${fmt(list.length)}`, tone: 'primary' },
      { key: 'revenue', label: "Today's Revenue", value: inr(todayRevenue), sub: 'Total Collection', tone: 'green' },
      { key: 'pending', label: 'Pending Reports', value: fmt(pending.length), sub: 'Yet to Complete', tone: 'orange' },
      { key: 'amount', label: 'Pending Amount', value: inr(pendingAmount), sub: `From ${fmt(pendingPatients)} Patients`, tone: 'purple' },
      { key: 'commission', label: 'Doctor Commission', value: inr(pendingCommission), sub: 'Pending Payout', tone: 'teal' },
      { key: 'expense', label: "Today's Expense", value: inr(expenseToday), sub: 'Total Expense', tone: 'red' },
      { key: 'monthly', label: 'Monthly Revenue', value: inr(monthRevenue), sub: 'This month', tone: 'primary' },
      { key: 'profit', label: 'Total Profit', value: inr(totalRevenue - expenseTotal - paidCommission), sub: 'Revenue − Expense', tone: 'green' },
    ];
  },

  async chart() {
    const list = await allReports();
    const labels = [];
    const values = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      values.push(list.filter((r) => {
        const t = new Date(r.createdAt);
        return t >= start && t <= end;
      }).length);
    }
    const weekStart = daysAgo(6);
    weekStart.setHours(0, 0, 0, 0);
    const weekReports = list.filter((r) => new Date(r.createdAt) >= weekStart);
    const totalReports = values.reduce((a, b) => a + b, 0);
    const totalRevenue = weekReports.reduce((s, r) => s + num(r.amount), 0);
    return {
      labels,
      values,
      totalReports: String(totalReports),
      totalRevenue: inr(totalRevenue),
      avgPerDay: String(Math.round(totalReports / 7)),
    };
  },
};

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

function sumBetween(list, from, to, field = 'amount') {
  return list
    .filter((r) => {
      const t = new Date(r.createdAt);
      return t >= from && t <= to;
    })
    .reduce((s, r) => s + num(r[field]), 0);
}

const analytics = {
  async overview() {
    const reportList = await allReports();
    const expenseList = await all('expenses');
    const payouts = await all('commissions');
    const now = new Date();

    const dayStart = startOfToday();
    const weekStart = daysAgo(6); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const revenue = {
      daily: sumBetween(reportList, dayStart, now),
      weekly: sumBetween(reportList, weekStart, now),
      monthly: sumBetween(reportList, monthStart, now),
      yearly: sumBetween(reportList, yearStart, now),
      total: reportList.reduce((s, r) => s + num(r.amount), 0),
    };
    const expenseTotal = expenseList.reduce((s, e) => s + num(e.amount), 0);
    const commissionPaid = payouts.reduce((s, p) => s + num(p.amount), 0);
    const pendingPayments = reportList.reduce((s, r) => s + num(r.pendingAmount ?? (r.paid ? 0 : r.amount)), 0);

    // Doctor-wise revenue
    const byDoctor = new Map();
    reportList.forEach((r) => {
      const k = r.doctor || 'Direct';
      const cur = byDoctor.get(k) || { doctor: k, reports: 0, revenue: 0, commission: 0 };
      cur.reports += 1;
      cur.revenue += num(r.amount);
      cur.commission += num(r.commission);
      cur.pendingAmount = (cur.pendingAmount || 0) + num(r.pendingAmount ?? (r.paid ? 0 : r.amount));
      byDoctor.set(k, cur);
    });

    // Test-wise revenue (a report may bill several tests)
    const byTest = new Map();
    reportList.forEach((r) => {
      const names = Array.isArray(r.tests) && r.tests.length
        ? r.tests.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
        : [r.test || 'Test'];
      names.forEach((name) => {
        const cur = byTest.get(name) || { test: name, count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += Math.round(num(r.amount) / names.length);
        byTest.set(name, cur);
      });
    });
    const tests = Array.from(byTest.values()).sort((a, b) => b.revenue - a.revenue);

    // 12-month revenue / expense trend
    const months = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        key: monthKey(d),
        revenue: sumBetween(reportList, d, end),
        expense: sumBetween(expenseList, d, end),
        reports: reportList.filter((r) => {
          const t = new Date(r.createdAt);
          return t >= d && t <= end;
        }).length,
      });
    }

    return {
      revenue,
      totalExpense: expenseTotal,
      commissionPaid,
      totalProfit: revenue.total - expenseTotal - commissionPaid,
      pendingPayments,
      totalReports: reportList.length,
      doctorWise: Array.from(byDoctor.values()).sort((a, b) => b.revenue - a.revenue),
      testWise: tests,
      mostPerformed: tests.slice().sort((a, b) => b.count - a.count)[0] || null,
      months,
    };
  },
};

/* ------------------------------------------------------------------ */
/* Subscription                                                        */
/* ------------------------------------------------------------------ */

const subscription = {
  plans: () => defaults.plans,

  async get() {
    ensureSeeded();
    let sub;
    if (useMemory()) {
      if (!mem.subscription) mem.subscription = defaultSubscription();
      sub = mem.subscription;
    } else {
      await ensureMongoSeeded();
      const doc = await Meta.findOne({ kind: 'subscription' }).sort({ updatedAt: -1 });
      sub = doc?.data || defaultSubscription();
    }
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
    const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now()) / (24 * 3600 * 1000)) : 0;
    return {
      ...sub,
      daysLeft,
      status: daysLeft > 0 ? 'Active' : 'Expired',
      expiringSoon: daysLeft > 0 && daysLeft <= 5,
      plans: defaults.plans,
    };
  },

  async subscribe(planId) {
    const plan = (defaults.plans || []).find((p) => p.id === planId);
    if (!plan) {
      const err = new Error('Unknown plan');
      err.status = 400;
      throw err;
    }
    const nextSubscription = (current) => {
      const currentExpiry = current.expiresAt ? new Date(current.expiresAt) : null;
      const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
      return {
        plan: plan.name,
        planId: plan.id,
        status: 'Active',
        startedAt: new Date(),
        expiresAt: new Date(base.getTime() + plan.days * 24 * 3600 * 1000),
        amount: plan.price,
        autoRenew: plan.id !== 'trial',
        history: [
          ...(current.history || []),
          {
            plan: plan.name,
            amount: plan.price,
            date: dateLabel(),
            invoice: `INV${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          },
        ],
      };
    };
    const ledgerEntry = (options = {}) => (
      plan.price > 0
        ? transactions.create({
          amount: plan.price,
          mode: 'UPI',
          type: 'Subscription',
          note: `${plan.name} activated`,
        }, options)
        : null
    );

    if (useMemory()) {
      ensureSeeded();
      const previous = mem.subscription || defaultSubscription();
      const next = nextSubscription(previous);
      // Publish the new expiry before yielding so simultaneous purchases extend
      // one another rather than charging twice for one period.
      mem.subscription = next;
      try {
        await ledgerEntry();
      } catch (error) {
        mem.subscription = previous;
        throw error;
      }
      return subscription.get();
    }

    await ensureMongoSeeded();
    await mongoTransaction(async (session) => {
      // The account row always exists and provides a shared write-conflict
      // point even before this account has a subscription document. MongoDB
      // retries a racing purchase against the newly extended expiry.
      const ownerId = requireTenantId();
      const account = await User.findOneAndUpdate(
        { _id: ownerId },
        { $set: { updatedAt: new Date() } },
        { new: true, session },
      ).lean();
      if (!account) throw Object.assign(new Error('Subscription account is unavailable'), { status: 503 });
      const doc = (await Meta.findOne({ kind: 'subscription' })
        .sort({ updatedAt: -1 }).session(session))
        || new Meta({ kind: 'subscription', data: defaultSubscription() });
      doc.data = nextSubscription(doc.data || {});
      doc.markModified('data');
      await doc.save({ session });
      await ledgerEntry({ session });
    }, 'Atomic subscription activation requires a transaction-capable MongoDB deployment');
    return subscription.get();
  },
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

async function notificationState() {
  ensureSeeded();
  if (useMemory()) return mem.notificationState;
  const doc = await Meta.findOne({ kind: 'notification-state' }).sort({ updatedAt: -1 });
  return { doc, read: doc?.data?.read || {} };
}

async function mutateNotificationState(mutate) {
  if (useMemory()) {
    const read = mem.notificationState;
    mutate(read);
    return read;
  }
  await ensureMongoSeeded();
  return mongoTransaction(async (session) => {
    // Serialize read-state changes on the tenant account so simultaneous marks
    // cannot overwrite one another, including before the singleton exists.
    const account = await User.findOneAndUpdate(
      { _id: requireTenantId() },
      { $set: { updatedAt: new Date() } },
      { new: true, session },
    ).lean();
    if (!account) throw Object.assign(new Error('Notification account is unavailable'), { status: 503 });
    const doc = (await Meta.findOne({ kind: 'notification-state' })
      .sort({ updatedAt: -1 }).session(session))
      || new Meta({ kind: 'notification-state', data: { read: {} } });
    const read = { ...(doc.data?.read || {}) };
    mutate(read);
    doc.data = { ...(doc.data || {}), read };
    doc.markModified('data');
    await doc.save({ session });
    return read;
  }, 'Atomic notification updates require a transaction-capable MongoDB deployment');
}

const notifications = {
  async list(query = {}) {
    const reportList = await allReports();
    const sub = await subscription.get();
    const wallet = await commissions.summary();
    const out = [];

    reportList.filter((r) => r.status === 'Completed').slice(0, 50).forEach((r) => out.push({
      id: `ready-${r._id}`, type: 'Report Ready', tone: 'green',
      title: `Report ready · ${r.test}`,
      subtitle: `${r.patient?.name || 'Patient'} · ${r.reportId}`,
      reportId: String(r._id), at: r.updatedAt || r.createdAt,
    }));

    reportList.filter((r) => num(r.pendingAmount ?? (r.paid ? 0 : r.amount)) > 0).slice(0, 50).forEach((r) => out.push({
      id: `pay-${r._id}`, type: 'Payment Pending', tone: 'orange',
      title: `Payment pending · ${inr(num(r.pendingAmount ?? r.amount))}`,
      subtitle: `${r.patient?.name || 'Patient'} · ${r.reportId}`,
      reportId: String(r._id), at: r.createdAt,
    }));

    if (wallet.pendingCommission > 0) out.push({
      id: 'commission-due', type: 'Doctor Commission Due', tone: 'purple',
      title: `Commission payout due · ${inr(wallet.pendingCommission)}`,
      subtitle: `${wallet.doctors.filter((d) => d.pendingCommission > 0).length} doctors waiting`, at: new Date(),
    });

    if (sub.daysLeft <= 7) out.push({
      id: 'subscription', type: 'Subscription Expiry', tone: sub.daysLeft > 0 ? 'orange' : 'red',
      title: sub.daysLeft > 0 ? `${sub.plan} expires in ${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'}` : `${sub.plan} has expired`,
      subtitle: 'Renew to keep cloud backup and WhatsApp sharing active', at: new Date(),
    });

    const holder = await notificationState();
    const read = useMemory() ? holder : holder.read;
    const list = out.map((item) => ({ ...item, read: !!read[item.id] }))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
    const filtered = String(query.unread || '') === 'true' ? list.filter((item) => !item.read) : list;
    return paged(filtered, query);
  },

  async markRead(id) {
    const list = await notifications.list();
    if (!list.some((item) => item.id === id)) throw Object.assign(new Error('Notification not found'), { status: 404 });
    await mutateNotificationState((read) => { read[id] = true; });
    return { id, read: true };
  },

  async markAllRead() {
    const list = await notifications.list();
    await mutateNotificationState((read) => {
      list.forEach((item) => { read[item.id] = true; });
    });
    return { read: list.length };
  },

  async unreadCount() {
    const list = await notifications.list();
    return list.filter((item) => !item.read).length;
  },
};

/* ------------------------------------------------------------------ */
/* Backup & restore                                                    */
/* ------------------------------------------------------------------ */

const BACKUP_VERSION = 3;
const MAX_BACKUP_RECORDS = 100000;

function backupOwnerProof() {
  return crypto.createHmac('sha256', authSecret()).update(`backup:${requireTenantId()}`).digest('hex');
}

function canonicalJson(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value && typeof value.toJSON === 'function') return canonicalJson(value.toJSON());
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item) ?? 'null').join(',')}]`;
  const entries = Object.keys(value).sort()
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(',')}}`;
}

function backupSignature(payload) {
  const unsigned = { ...payload, meta: { ...(payload.meta || {}) } };
  delete unsigned.meta.signature;
  return crypto.createHmac('sha256', authSecret())
    .update(`pathonexa-backup:${BACKUP_VERSION}:${requireTenantId()}\0`)
    .update(canonicalJson(unsigned))
    .digest('hex');
}

function safeHexEqual(supplied, expected) {
  const left = String(supplied || '');
  if (!/^[a-f\d]{64}$/i.test(left)) return false;
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function plainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function backupRecords(value, label) {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_BACKUP_RECORDS) throw Object.assign(new Error('Backup is too large'), { status: 413 });
  value.forEach((item) => {
    if (!plainObject(item)) badRequest(`Backup contains an invalid ${label} record`);
  });
  return value;
}

function pick(source, fields) {
  const out = {};
  fields.forEach((field) => { if (source?.[field] !== undefined) out[field] = source[field]; });
  return out;
}

function reportPatientKeys(value) {
  if (value && typeof value === 'object') return [value._id, value.id, value.pid].filter(Boolean).map(String);
  return value == null ? [] : [String(value)];
}

function validateUnique(list, field, label) {
  const values = list.map((item) => String(item[field] || '')).filter(Boolean);
  if (new Set(values).size !== values.length) throw Object.assign(new Error(`Backup contains duplicate ${label}`), { status: 400 });
}

async function backupState() {
  if (useMemory()) return { lastBackupAt: mem.lastBackupAt || null };
  const doc = await Meta.findOne({ kind: 'backup-state' });
  return { lastBackupAt: doc?.data?.lastBackupAt || null, doc };
}

const backup = {
  async export() {
    ensureSeeded();
    const holder = await notificationState();
    const notificationRead = useMemory() ? holder : holder.read;
    const data = {
      meta: {
        app: 'PathoNexa', version: BACKUP_VERSION, owner: backupOwnerProof(),
        exportedAt: new Date().toISOString(), storage: useMemory() ? 'memory' : 'mongodb',
      },
      patients: await patients.list(), reports: await reports.list(),
      settings: await settings.get(), subscription: await subscription.get(),
      notificationRead, sequences: await sequenceState(),
    };
    for (const kind of COLLECTIONS) data[kind] = await all(kind); // eslint-disable-line no-restricted-syntax
    data.deleted = await meta.deleted();
    data.meta.signature = backupSignature(data);
    return data;
  },

  async restore(payload) {
    if (!plainObject(payload) || !plainObject(payload.meta)
      || payload.meta.app !== 'PathoNexa' || payload.meta.version !== BACKUP_VERSION) {
      throw Object.assign(new Error('A valid PathoNexa backup is required'), { status: 400 });
    }
    if (!safeHexEqual(payload.meta.owner, backupOwnerProof())) {
      throw Object.assign(new Error('This backup belongs to a different account'), { status: 403 });
    }
    if (!safeHexEqual(payload.meta.signature, backupSignature(payload))) {
      throw Object.assign(new Error('Backup integrity check failed'), { status: 400 });
    }

    // Validate and normalize the complete signed snapshot before changing any
    // current record. This prevents malformed later sections from leaving a
    // partially restored account.
    const patientRecords = backupRecords(payload.patients, 'patient');
    const reportRecords = backupRecords(payload.reports, 'report');
    const hasPatients = patientRecords !== null;
    const hasReports = reportRecords !== null;
    const incomingPatients = hasPatients ? patientRecords : await patients.list();
    const preparedPatients = incomingPatients.map((item) => ({
      ...patientPatch(item, true),
      pid: String(item?.pid || '').trim(),
      _sourceKeys: [item?._id, item?.id, item?.pid].filter(Boolean).map(String),
    }));
    preparedPatients.forEach((item) => {
      if (!item.pid) badRequest('Backup contains an invalid patient');
    });
    validateUnique(preparedPatients, 'pid', 'patient IDs');
    validateUnique(preparedPatients, 'mobile', 'patient mobile numbers');

    const sourcePatientIndex = new Map();
    preparedPatients.forEach((item, index) => item._sourceKeys.forEach((key) => {
      const existing = sourcePatientIndex.get(key);
      if (existing !== undefined && existing !== index) badRequest('Backup contains ambiguous patient references');
      sourcePatientIndex.set(key, index);
    }));

    const sourceDoctors = backupRecords(payload.doctors, 'doctors');
    const sourceDoctorIndex = new Map();
    (sourceDoctors || []).forEach((doctor, index) => {
      [doctor?._id, doctor?.id, doctor?.name].filter(Boolean).forEach((key) => {
        const normalized = String(key);
        const existing = sourceDoctorIndex.get(normalized);
        if (existing !== undefined && existing !== index) badRequest('Backup contains ambiguous doctor references');
        sourceDoctorIndex.set(normalized, index);
      });
    });

    const preparedReports = (reportRecords || []).map((item) => {
      const sourceIndex = reportPatientKeys(item.patient)
        .map((key) => sourcePatientIndex.get(key))
        .find((value) => value !== undefined);
      if (sourceIndex === undefined) badRequest('Backup report references an unavailable patient');
      const doctorName = String(item.doctor || 'Direct');
      const sourceDoctor = [item.doctorId, doctorName]
        .filter(Boolean)
        .map((key) => sourceDoctorIndex.get(String(key)))
        .find((value) => value !== undefined);
      if (sourceDoctors && doctorName !== 'Direct' && sourceDoctor === undefined) {
        badRequest('Backup report references an unavailable doctor');
      }
      const report = {
        ...pick(item, ['reportId', ...REPORT_FIELDS]),
        reportId: String(item.reportId || '').trim(),
        test: String(item.test || '').trim(),
        _sourcePatientIndex: sourceIndex,
        _sourceDoctorIndex: sourceDoctor,
      };
      if (!report.reportId || !report.test) badRequest('Backup contains an invalid report');
      if (report.status !== undefined && !['Pending', 'Completed', 'Cancelled'].includes(report.status)) {
        badRequest('Backup contains an invalid report');
      }
      normalizeReportFinancials(report);
      assertDiscountAllowed(report.amount, report.discount);
      return report;
    });
    validateUnique(preparedReports, 'reportId', 'report IDs');

    const preparedCollections = new Map();
    for (const kind of COLLECTIONS) {
      const source = backupRecords(payload[kind], kind);
      if (source === null) continue;
      const records = source.map((item) => {
        const { _id, id, ownerId, createdAt, updatedAt, ...data } = item; // eslint-disable-line no-unused-vars
        return data;
      });
      if (kind === 'doctors') {
        const names = new Set();
        records.forEach((doctor) => {
          const name = String(doctor.name || '').trim();
          const key = name.toLocaleLowerCase('en-IN');
          if (!name || names.has(key)) badRequest('Backup contains duplicate or invalid doctors');
          names.add(key);
          doctor.name = name;
        });
      }
      if (kind === 'commissions') {
        records.forEach((commission) => {
          commission._sourceDoctorIndex = [commission.doctorId, commission.doctor]
            .filter(Boolean)
            .map((key) => sourceDoctorIndex.get(String(key)))
            .find((value) => value !== undefined);
        });
      }
      preparedCollections.set(kind, records);
    }

    let preparedDeleted = null;
    const deletedRecords = backupRecords(payload.deleted, 'deleted');
    if (deletedRecords !== null) {
      const allowedKinds = new Set(['patients', 'reports', ...COLLECTIONS]);
      const deletedPatientSources = new Map();
      deletedRecords.forEach((item) => {
        if (item.kind !== 'patients') return;
        [item._id, item.id, item.pid].filter(Boolean).forEach((key) => {
          deletedPatientSources.set(String(key), item);
        });
      });
      preparedDeleted = deletedRecords.map((item) => {
        const { _id, id, ownerId, createdAt, updatedAt, ...data } = item; // eslint-disable-line no-unused-vars
        if (!allowedKinds.has(data.kind)) badRequest('Backup contains an invalid deleted record');
        if (data.kind === 'reports') {
          const patientKeys = reportPatientKeys(data.patient);
          const sourceIndex = patientKeys
            .map((key) => sourcePatientIndex.get(key))
            .find((value) => value !== undefined);
          const deletedPatient = patientKeys
            .map((key) => deletedPatientSources.get(key))
            .find(Boolean);
          const doctorName = String(data.doctor || 'Direct');
          const doctorIndex = [data.doctorId, doctorName]
            .filter(Boolean)
            .map((key) => sourceDoctorIndex.get(String(key)))
            .find((value) => value !== undefined);
          return {
            ...data,
            ...(sourceIndex === undefined && deletedPatient
              ? { patient: { pid: deletedPatient.pid } }
              : {}),
            _sourcePatientIndex: sourceIndex,
            _sourceDoctorIndex: doctorIndex,
          };
        }
        return data;
      });
    }

    for (const [field, value] of [
      ['settings', payload.settings],
      ['subscription', payload.subscription],
      ['notification state', payload.notificationRead],
    ]) {
      if (value !== undefined && !plainObject(value)) badRequest(`Backup contains invalid ${field}`);
    }
    if (plainObject(payload.notificationRead)
      && Object.keys(payload.notificationRead).length > MAX_BACKUP_RECORDS) {
      throw Object.assign(new Error('Backup is too large'), { status: 413 });
    }
    const cleanNotificationRead = plainObject(payload.notificationRead)
      ? Object.fromEntries(Object.entries(payload.notificationRead).map(([key, value]) => [key, !!value]))
      : null;
    const patientSequence = Math.max(maxSequence(preparedPatients, 'pid'), num(payload.sequences?.patient));
    const reportSequence = Math.max(maxSequence(preparedReports, 'reportId'), num(payload.sequences?.report));
    const counts = {};

    if (useMemory()) {
      // Build every replacement first, then swap the tenant state only after
      // the complete snapshot is known to be valid.
      const restoredPatients = hasPatients
        ? preparedPatients.map(({ _sourceKeys, ...item }) => ({
          ...item, _id: makeId(), createdAt: new Date(), updatedAt: new Date(),
        }))
        : incomingPatients;
      const restoredCollections = new Map();
      preparedCollections.forEach((records, kind) => {
        restoredCollections.set(kind, records.map((data) => {
          const id = makeId();
          return { ...data, _id: id, id, createdAt: new Date(), updatedAt: new Date() };
        }));
      });
      const restoredDoctors = restoredCollections.get('doctors') || [];
      (restoredCollections.get('commissions') || []).forEach((commission) => {
        const doctorIndex = commission._sourceDoctorIndex;
        delete commission._sourceDoctorIndex;
        if (doctorIndex !== undefined) commission.doctorId = restoredDoctors[doctorIndex]?._id || '';
      });
      const restoredReports = hasReports
        ? preparedReports.map(({ _sourcePatientIndex, _sourceDoctorIndex, ...item }) => ({
          ...item,
          _id: makeId(),
          patient: restoredPatients[_sourcePatientIndex],
          ...(_sourceDoctorIndex !== undefined
            ? { doctorId: restoredDoctors[_sourceDoctorIndex]?._id || null }
            : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
        : (hasPatients ? [] : null);
      const restoredDeleted = preparedDeleted?.map((data) => {
        const { _sourcePatientIndex, _sourceDoctorIndex, ...record } = data;
        return {
          ...record,
          ...(record.kind === 'reports' && _sourcePatientIndex !== undefined
            ? { patient: restoredPatients[_sourcePatientIndex] }
            : {}),
          ...(record.kind === 'reports' && _sourceDoctorIndex !== undefined
            ? { doctorId: restoredDoctors[_sourceDoctorIndex]?._id || null }
            : {}),
          _id: makeId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      if (hasPatients) {
        mem.patients = restoredPatients;
        counts.patients = restoredPatients.length;
      }
      if (restoredReports) {
        mem.reports = restoredReports;
        counts.reports = restoredReports.length;
      }
      restoredCollections.forEach((records, kind) => {
        mem[kind] = records;
        counts[kind] = records.length;
      });
      if (restoredDeleted) {
        mem.deleted = restoredDeleted;
        counts.deleted = restoredDeleted.length;
      }
      if (plainObject(payload.settings)) mem.settings = { ...defaultSettings(), ...payload.settings };
      if (plainObject(payload.subscription)) mem.subscription = structuredClone(payload.subscription);
      if (cleanNotificationRead) mem.notificationState = cleanNotificationRead;
      if (hasPatients) mem.sequences.patient = Math.max(num(mem.sequences.patient), patientSequence);
      if (hasReports) mem.sequences.report = Math.max(num(mem.sequences.report), reportSequence);
      return { restored: counts, storage: 'memory' };
    }

    try {
      await mongoose.connection.transaction(async (session) => {
        let restoredPatients = incomingPatients;
        if (hasPatients) {
          await Report.deleteMany({}).session(session);
          await Patient.deleteMany({}).session(session);
          restoredPatients = preparedPatients.length
            ? await Patient.insertMany(
              preparedPatients.map(({ _sourceKeys, ...item }) => item),
              { session },
            )
            : [];
          counts.patients = restoredPatients.length;
        }

        let restoredDoctors = null;
        if (preparedCollections.has('doctors')) {
          const doctorRecords = preparedCollections.get('doctors');
          await Meta.deleteMany({ kind: 'doctors' }).session(session);
          restoredDoctors = doctorRecords.length
            ? await Meta.insertMany(doctorRecords.map((data) => ({ kind: 'doctors', data })), { session })
            : [];
          counts.doctors = restoredDoctors.length;
        }

        if (hasReports) {
          const records = preparedReports.map(({ _sourcePatientIndex, _sourceDoctorIndex, ...item }) => ({
            ...item,
            patient: restoredPatients[_sourcePatientIndex]._id,
            ...(_sourceDoctorIndex !== undefined
              ? { doctorId: restoredDoctors?.[_sourceDoctorIndex]?._id || null }
              : {}),
          }));
          if (!hasPatients) await Report.deleteMany({}).session(session);
          if (records.length) await Report.insertMany(records, { session });
          counts.reports = records.length;
        } else if (hasPatients) {
          counts.reports = 0;
        }

        if (hasPatients) {
          await TenantCounter.findOneAndUpdate(
            { key: 'patient' }, { $max: { value: patientSequence } },
            { upsert: true, setDefaultsOnInsert: true, session },
          );
        }
        if (hasReports) {
          await TenantCounter.findOneAndUpdate(
            { key: 'report' }, { $max: { value: reportSequence } },
            { upsert: true, setDefaultsOnInsert: true, session },
          );
        }

        for (const [kind, records] of preparedCollections) {
          if (kind === 'doctors') continue;
          await Meta.deleteMany({ kind }).session(session);
          const remapped = records.map((data) => {
            const { _sourceDoctorIndex, ...record } = data;
            return {
              ...record,
              ...(kind === 'commissions' && _sourceDoctorIndex !== undefined
                ? { doctorId: String(restoredDoctors?.[_sourceDoctorIndex]?._id || '') }
                : {}),
            };
          });
          if (remapped.length) await Meta.insertMany(remapped.map((data) => ({ kind, data })), { session });
          counts[kind] = remapped.length;
        }
        if (preparedDeleted) {
          await Meta.deleteMany({ kind: 'deleted' }).session(session);
          if (preparedDeleted.length) {
            const deleted = preparedDeleted.map((data) => {
              const { _sourcePatientIndex, _sourceDoctorIndex, ...record } = data;
              return {
                kind: 'deleted',
                data: {
                  ...record,
                  ...(record.kind === 'reports' && _sourcePatientIndex !== undefined
                    ? { patient: restoredPatients[_sourcePatientIndex]._id }
                    : {}),
                  ...(record.kind === 'reports' && _sourceDoctorIndex !== undefined
                    ? { doctorId: restoredDoctors?.[_sourceDoctorIndex]?._id || null }
                    : {}),
                },
              };
            });
            await Meta.insertMany(deleted, { session });
          }
          counts.deleted = preparedDeleted.length;
        }

        const replaceSingleton = async (kind, data) => {
          if (!data) return;
          await Meta.deleteMany({ kind }).session(session);
          await Meta.create([{ kind, data }], { session });
        };
        await replaceSingleton(
          'settings',
          plainObject(payload.settings) ? { ...defaultSettings(), ...payload.settings } : null,
        );
        await replaceSingleton(
          'subscription',
          plainObject(payload.subscription) ? payload.subscription : null,
        );
        await replaceSingleton(
          'notification-state',
          cleanNotificationRead ? { read: cleanNotificationRead } : null,
        );
      });
    } catch (error) {
      if (error?.code === 20 || /Transaction numbers are only allowed|does not support transactions/i.test(error?.message || '')) {
        throw Object.assign(new Error('Atomic backup restore requires a transaction-capable MongoDB deployment'), { status: 503 });
      }
      throw error;
    }
    return { restored: counts, storage: 'mongodb' };
  },

  async status() {
    const data = {
      patients: (await patients.list()).length, reports: (await reports.list()).length,
      tests: (await all('tests')).length, doctors: (await all('doctors')).length,
      transactions: (await all('transactions')).length, expenses: (await all('expenses')).length,
    };
    const labSettings = await settings.get();
    const state = await backupState();
    return {
      storage: useMemory() ? 'Development memory' : 'MongoDB', autoBackup: !!labSettings.autoBackup,
      lastBackupAt: state.lastBackupAt, records: data,
      totalRecords: Object.values(data).reduce((sum, value) => sum + value, 0),
    };
  },

  async run() {
    const at = new Date();
    if (useMemory()) mem.lastBackupAt = at;
    else {
      const doc = (await Meta.findOne({ kind: 'backup-state' })) || await Meta.create({ kind: 'backup-state', data: {} });
      doc.data = { ...(doc.data || {}), lastBackupAt: at }; doc.markModified('data'); await doc.save();
    }
    const snapshot = await backup.export();
    return { ok: true, at, records: Object.keys(snapshot).length };
  },
};

module.exports = {
  auth, roles, patients, reports, dashboard, meta, settings, transactions,
  doctors, commissions, expenses, analytics, subscription, notifications,
  backup, payments, useMemory,
};
