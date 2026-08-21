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
const Meta = require('../models/Meta');
const TenantCounter = require('../models/TenantCounter');
const defaults = require('./seedData');
const cfg = require('../config/appConfig');
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
    mongoOnboarding.set(ownerId, (async () => {
      const marker = await Meta.findOne({ kind: 'onboarding' });
      if (marker) return;
      const docs = (defaults.tests || []).map(({ id, ...data }) => ({ kind: 'tests', data }));
      if (docs.length) await Meta.insertMany(docs);
      await Meta.create({ kind: 'onboarding', data: { version: 1, completedAt: new Date() } });
    })().catch((error) => { mongoOnboarding.delete(ownerId); throw error; }));
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
function authSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || (process.env.NODE_ENV === 'production' && secret.length < 32)) {
    throw Object.assign(new Error('Server authentication is not configured'), { status: 503 });
  }
  return secret;
}
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
  return { id: String(user._id), mobile: user.mobile, name: user.name, role: user.role, permissions: permissionsFor(user.role) };
}

const auth = {
  async login(mobile) {
    await db.whenReady();
    mobile = String(mobile || '').trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) throw Object.assign(new Error('A valid 10-digit Indian mobile number is required'), { status: 400 });
    const now = Date.now();
    const existing = globalMem.otpChallenges.get(mobile);
    if (existing && now - existing.requestedAt < 1500) throw Object.assign(new Error('Please wait before requesting another OTP'), { status: 429 });
    globalMem.otpChallenges.set(mobile, { hash: otpHash(mobile, OTP), expiresAt: now + 5 * 60_000, requestedAt: now, attempts: 0 });
    return { message: 'OTP sent successfully', expiresInSeconds: 300 };
  },

  async verify(mobile, otp) {
    await db.whenReady();
    mobile = String(mobile || '').trim();
    otp = String(otp || '').trim();
    if (!/^[6-9]\d{9}$/.test(mobile) || !/^\d{6}$/.test(otp)) throw Object.assign(new Error('Mobile number and OTP are required'), { status: 400 });
    const challenge = globalMem.otpChallenges.get(mobile);
    if (!challenge || challenge.expiresAt < Date.now() || challenge.attempts >= 5) {
      globalMem.otpChallenges.delete(mobile);
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }
    challenge.attempts += 1;
    const actual = Buffer.from(challenge.hash, 'hex');
    const supplied = Buffer.from(otpHash(mobile, otp), 'hex');
    if (actual.length !== supplied.length || !crypto.timingSafeEqual(actual, supplied)) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    globalMem.otpChallenges.delete(mobile);

    let user;
    if (useMemory()) {
      user = globalMem.users.find((item) => item.mobile === mobile);
      if (!user) {
        user = { _id: makeId(), mobile, name: 'Lab Owner', role: 'Lab Owner', createdAt: new Date() };
        globalMem.users.push(user);
      }
    } else {
      user = await User.findOne({ mobile });
      if (!user) user = await User.create({ mobile, name: 'Lab Owner', role: 'Lab Owner' });
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
    const allowed = {};
    PATIENT_FIELDS.forEach((k) => {
      if (patch[k] !== undefined) allowed[k] = patch[k];
    });
    if (useMemory()) {
      const p = mem.patients.find((x) => x._id === id || x.pid === id);
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 404;
        throw err;
      }
      Object.assign(p, allowed, { updatedAt: new Date() });
      return p;
    }
    const p = await Patient.findOneAndUpdate(byIdOrPid(id), { $set: allowed }, { new: true }).lean();
    if (!p) {
      const err = new Error('Patient not found');
      err.status = 404;
      throw err;
    }
    return p;
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
      const [removed] = mem.patients.splice(i, 1);
      mem.deleted.unshift({ ...removed, kind: 'patients', deletedAt: new Date() });
      return removed;
    }
    const p = await Patient.findOneAndDelete(byIdOrPid(id)).lean();
    if (!p) {
      const err = new Error('Patient not found');
      err.status = 404;
      throw err;
    }
    await Meta.create({ kind: 'deleted', data: { ...p, kind: 'patients', deletedAt: new Date() } });
    return p;
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
    const { name, mobile, age, gender } = data || {};
    if (!name || !mobile || !age || !gender) {
      const err = new Error('Name, mobile, age and gender are required');
      err.status = 400;
      throw err;
    }
    if (!/^[6-9]\d{9}$/.test(String(mobile))) {
      const err = new Error('Enter a valid 10-digit Indian mobile number');
      err.status = 400;
      throw err;
    }
    ensureSeeded();
    if (useMemory()) {
      const exists = mem.patients.find((p) => p.mobile === mobile);
      if (exists) {
        const err = new Error('A patient with this mobile number already exists');
        err.status = 400;
        throw err;
      }
      const doc = {
        ...data,
        _id: makeId(),
        pid: genPid(new Date(), await nextSequence('patient')),
        color: data.color || '#DBEAFE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mem.patients.unshift(doc);
      return doc;
    }
    const exists = await Patient.findOne({ mobile });
    if (exists) {
      const err = new Error('A patient with this mobile number already exists');
      err.status = 400;
      throw err;
    }
    try {
      const doc = await Patient.create({ ...data, pid: genPid(new Date(), await nextSequence('patient')) });
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
  'status', 'paid', 'amount', 'values', 'discount', 'paidAmount', 'pendingAmount',
  'paymentMode', 'remarks', 'sampleDate', 'reportDate', 'technician', 'verified',
  'verifiedBy', 'doctor', 'test', 'tests', 'date', 'time', 'commission',
  'commissionPaid', 'transactionId', 'package',
];

async function commissionRateFor(doctorName) {
  if (!doctorName || doctorName === 'Direct') return 0;
  const list = await all('doctors');
  const doc = list.find((d) => d.name === doctorName);
  if (!doc) return 0;
  // Fall back to the .env default (DEFAULT_COMMISSION_PERCENT) when the
  // doctor's profile has no commission set. An explicit 0 stays 0.
  if (doc.commission === undefined || doc.commission === null || doc.commission === '') {
    return cfg.defaultCommissionPercent;
  }
  return num(doc.commission);
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
    const payload = { ...(data || {}) };
    if (!payload.reportId) payload.reportId = await reports.nextReportId();
    const { reportId, patient, test, amount } = payload;
    if (!reportId || !patient || !test || amount === undefined) {
      const err = new Error('reportId, patient, test and amount are required');
      err.status = 400;
      throw err;
    }
    ensureSeeded();

    const rate = await commissionRateFor(payload.doctor);
    assertDiscountAllowed(payload.amount, payload.discount);
    payload.commissionRate = rate;
    payload.commission = Math.round((num(payload.amount) * rate) / 100);
    payload.commissionPaid = payload.commissionPaid || false;
    payload.date = payload.date || dateLabel();
    payload.time = payload.time || timeLabel();

    // Resolve the reference through the tenant-scoped patient API before any
    // report is created. A valid ObjectId belonging to another account is
    // indistinguishable from a missing patient and can never be attached.
    const ownPatient = await patients.getById(String(patient));
    const ownPatientId = String(ownPatient._id);

    let doc;
    if (useMemory()) {
      doc = { ...payload, _id: makeId(), patient: ownPatient, createdAt: new Date(), updatedAt: new Date() };
      ownPatient.lastTest = payload.test;
      ownPatient.lastTestDate = payload.date;
      mem.reports.unshift(doc);
    } else {
      const created = await Report.create({ ...payload, patient: ownPatientId });
      await Patient.findOneAndUpdate(byIdOrPid(ownPatientId), {
        $set: { lastTest: payload.test, lastTestDate: payload.date },
      });
      doc = await Report.findById(created._id).populate('patient').lean();
    }

    // Every billed rupee lands in the payment ledger.
    if (num(payload.paidAmount) > 0) {
      await transactions.create({
        reportId: doc.reportId,
        report: String(doc._id),
        patient: doc.patient?.name,
        patientId: String(doc.patient?._id || ''),
        amount: num(payload.paidAmount),
        mode: payload.paymentMode || 'Cash',
        type: 'Collection',
        note: 'Report billing',
        txnId: payload.transactionId,
      });
    }
    return doc;
  },

  async update(id, patch) {
    ensureSeeded();
    const allowed = {};
    REPORT_FIELDS.forEach((k) => {
      if (patch[k] !== undefined) allowed[k] = patch[k];
    });
    if (allowed.amount !== undefined || allowed.doctor !== undefined) {
      const current = await reports.getById(id);
      const rate = await commissionRateFor(allowed.doctor ?? current.doctor);
      allowed.commissionRate = rate;
      allowed.commission = Math.round((num(allowed.amount ?? current.amount) * rate) / 100);
    }
    if (allowed.discount !== undefined || allowed.amount !== undefined) {
      const current = await reports.getById(id);
      assertDiscountAllowed(allowed.amount ?? current.amount, allowed.discount ?? current.discount);
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
    const r = await Report.findOneAndUpdate(byIdOrPid(id), { $set: allowed }, { new: true })
      .populate('patient').lean();
    if (!r) {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    return r;
  },

  /** Owner verification step from the workflow (optional but tracked). */
  async verify(id, by) {
    return reports.update(id, { verified: true, verifiedBy: by || 'Lab Owner', status: 'Completed' });
  },

  /** "Duplicate" action from the report history screen. */
  async duplicate(id) {
    const src = await reports.getById(id);
    const patientId = String(src.patient?._id || src.patient);
    const copy = {
      reportId: await reports.nextReportId(),
      patient: patientId,
      test: src.test,
      doctor: src.doctor,
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
    const r = await Report.findOneAndDelete(byIdOrPid(id)).lean();
    if (!r) {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    await Meta.create({ kind: 'deleted', data: { ...r, kind: 'reports', deletedAt: new Date() } });
    return r;
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

function collectionApi(key, required = []) {
  return {
    async list() {
      return all(key);
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
    async create(data) {
      ensureSeeded();
      for (const f of required) {
        if (data == null || data[f] == null || data[f] === '') {
          const err = new Error(`${f} is required`);
          err.status = 400;
          throw err;
        }
      }
      if (useMemory()) {
        const doc = { ...data, _id: makeId(), createdAt: new Date(), updatedAt: new Date() };
        doc.id = doc._id;
        mem[key].unshift(doc);
        return doc;
      }
      await ensureMongoSeeded();
      const created = await Meta.create({ kind: key, data: { ...data, id: undefined } });
      return { ...created.data, _id: String(created._id), id: String(created._id) };
    },
    async update(id, patch) {
      ensureSeeded();
      if (useMemory()) {
        const item = mem[key].find((x) => String(x._id) === String(id) || String(x.id) === String(id));
        if (!item) {
          const err = new Error('Not found');
          err.status = 404;
          throw err;
        }
        Object.assign(item, patch, { updatedAt: new Date() });
        return item;
      }
      const doc = await Meta.findById(id);
      if (!doc) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      doc.data = { ...doc.data, ...patch };
      doc.markModified('data');
      await doc.save();
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
        const [removed] = mem[key].splice(i, 1);
        mem.deleted.unshift({ ...removed, kind: key, deletedAt: new Date() });
        return removed;
      }
      const doc = await Meta.findByIdAndDelete(id);
      if (!doc) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      await Meta.create({ kind: 'deleted', data: { ...doc.data, kind: key, deletedAt: new Date() } });
      return { ...doc.data, _id: String(doc._id) };
    },
  };
}

// Doctors get the .env default commission (DEFAULT_COMMISSION_PERCENT) when
// they are created without an explicit commission percentage.
const doctorsApi = collectionApi('doctors', ['name']);
const baseDoctorCreate = doctorsApi.create;
doctorsApi.create = (data = {}) => {
  const d = { ...data };
  if (d.commission === undefined || d.commission === null || d.commission === '') {
    d.commission = cfg.defaultCommissionPercent;
  }
  return baseDoctorCreate(d);
};

const meta = {
  tests: collectionApi('tests', ['name', 'price']),
  doctors: doctorsApi,
  employees: collectionApi('employees', ['name', 'role']),
  centers: collectionApi('centers', ['name']),
  payments: collectionApi('payments', ['name']),
  discounts: collectionApi('discounts', ['name']),
  templates: collectionApi('templates', ['name']),
  packages: collectionApi('packages', ['name', 'price']),
  expenses: collectionApi('expenses', ['name', 'amount']),
  transactions: collectionApi('transactions', ['amount']),
  commissions: collectionApi('commissions', ['doctor', 'amount']),
  drafts: collectionApi('drafts', []),
  labs: collectionApi('labs', ['name']),
  roles: collectionApi('roles', ['name']),

  async deleted() {
    ensureSeeded();
    if (useMemory()) return [...mem.deleted];
    const docs = await Meta.find({ kind: 'deleted' }).sort({ createdAt: -1 }).lean();
    return docs.map((d) => ({ ...d.data, _id: String(d._id) }));
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
      const [rec] = mem.deleted.splice(i, 1);
      const { kind, deletedAt, ...rest } = rec;
      if (kind === 'patients') mem.patients.unshift({ ...rest, updatedAt: new Date() });
      else if (kind === 'reports') mem.reports.unshift({ ...rest, updatedAt: new Date() });
      else if (mem[kind]) mem[kind].unshift({ ...rest, updatedAt: new Date() });
      return rest;
    }
    const doc = await Meta.findById(id);
    if (!doc) {
      const err = new Error('Deleted record not found');
      err.status = 404;
      throw err;
    }
    const { kind, deletedAt, _id, ...rest } = doc.data || {};
    if (kind === 'patients') await Patient.create(rest);
    else if (kind === 'reports') await Report.create(rest);
    else await Meta.create({ kind, data: rest });
    await doc.deleteOne();
    return rest;
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
    const doc = await Meta.findOne({ kind: 'settings' });
    if (!doc) {
      const created = await Meta.create({ kind: 'settings', data: defaultSettings() });
      return { ...created.data };
    }
    return { ...defaultSettings(), ...doc.data };
  },
  async update(patch) {
    ensureSeeded();
    if (useMemory()) {
      mem.settings = { ...(mem.settings || defaultSettings()), ...(patch || {}) };
      return { ...mem.settings };
    }
    const doc = (await Meta.findOne({ kind: 'settings' })) || (await Meta.create({ kind: 'settings', data: defaultSettings() }));
    doc.data = { ...doc.data, ...(patch || {}) };
    doc.markModified('data');
    await doc.save();
    return { ...doc.data };
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

  async create(data) {
    const amount = num(data.amount);
    if (!amount) {
      const err = new Error('A payment amount is required');
      err.status = 400;
      throw err;
    }
    return meta.transactions.create({
      txnId: data.txnId || `TXN${Date.now().toString().slice(-8)}`,
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
    });
  },

  /** Collect a pending amount against a report and update its balance. */
  async collect({ reportId, amount, mode, txnId, note }) {
    const report = await reports.getById(reportId);
    const pay = Math.min(num(amount) || num(report.pendingAmount), num(report.pendingAmount) || num(report.amount));
    if (pay <= 0) {
      const err = new Error('This report has no pending amount');
      err.status = 400;
      throw err;
    }
    const paidAmount = num(report.paidAmount) + pay;
    const pendingAmount = Math.max(0, num(report.amount) - paidAmount);
    const updated = await reports.update(String(report._id), {
      paidAmount,
      pendingAmount,
      paid: pendingAmount === 0,
      paymentMode: mode || report.paymentMode,
    });
    const txn = await transactions.create({
      reportId: report.reportId,
      report: String(report._id),
      patient: report.patient?.name,
      patientId: String(report.patient?._id || ''),
      amount: pay,
      mode: mode || report.paymentMode || 'Cash',
      type: 'Collection',
      note: note || 'Pending amount collected',
      txnId,
    });
    return { report: updated, transaction: txn };
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

const doctors = {
  async list() {
    const list = await all('doctors');
    const reportList = await allReports();
    const payouts = await all('commissions');
    return list.map((d) => {
      const rs = reportList.filter((r) => r.doctor === d.name);
      const earned = rs.reduce((s, r) => s + Math.round((num(r.amount) * num(d.commission)) / 100), 0);
      const paid = payouts.filter((p) => p.doctor === d.name).reduce((s, p) => s + num(p.amount), 0);
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
    const payouts = (await all('commissions')).filter((p) => p.doctor === doctor.name);
    const rs = reportList.filter((r) => r.doctor === doctor.name);
    const rate = num(doctor.commission);

    const monthly = new Map();
    rs.forEach((r) => {
      const key = monthKey(r.createdAt || Date.now());
      const cur = monthly.get(key) || { key, label: monthLabel(key), reports: 0, business: 0, commission: 0 };
      cur.reports += 1;
      cur.business += num(r.amount);
      cur.commission += Math.round((num(r.amount) * rate) / 100);
      monthly.set(key, cur);
    });

    const totalCommission = rs.reduce((s, r) => s + Math.round((num(r.amount) * rate) / 100), 0);
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
        commission: Math.round((num(r.amount) * rate) / 100),
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
    let name = doctor;
    if (!name && doctorId) name = (await meta.doctors.get(doctorId)).name;
    if (!name) {
      const err = new Error('Doctor is required');
      err.status = 400;
      throw err;
    }
    const payout = await meta.commissions.create({
      doctor: name,
      doctorId: doctorId || '',
      amount: num(amount),
      mode: mode || 'Cash',
      note: note || 'Commission payout',
      date: dateLabel(),
      time: timeLabel(),
    });
    // Payouts leave the lab account — they belong in the ledger too.
    await transactions.create({
      amount: num(amount),
      mode: mode || 'Cash',
      type: 'Commission Payout',
      note: `Commission paid to ${name}`,
      patient: name,
    });
    return payout;
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
      const doc = (await Meta.findOne({ kind: 'subscription' }))
        || (await Meta.create({ kind: 'subscription', data: defaultSubscription() }));
      sub = doc.data;
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
    const current = await subscription.get();
    const base = current.daysLeft > 0 && current.expiresAt ? new Date(current.expiresAt) : new Date();
    const expiresAt = new Date(base.getTime() + plan.days * 24 * 3600 * 1000);
    const next = {
      plan: plan.name,
      planId: plan.id,
      status: 'Active',
      startedAt: new Date(),
      expiresAt,
      amount: plan.price,
      autoRenew: plan.id !== 'trial',
      history: [
        ...(current.history || []),
        { plan: plan.name, amount: plan.price, date: dateLabel(), invoice: `INV${Date.now().toString().slice(-8)}` },
      ],
    };
    if (useMemory()) {
      mem.subscription = next;
    } else {
      const doc = (await Meta.findOne({ kind: 'subscription' }))
        || (await Meta.create({ kind: 'subscription', data: next }));
      doc.data = next;
      doc.markModified('data');
      await doc.save();
    }
    if (plan.price > 0) {
      await transactions.create({
        amount: plan.price,
        mode: 'UPI',
        type: 'Subscription',
        note: `${plan.name} activated`,
      });
    }
    return subscription.get();
  },
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

async function notificationState() {
  ensureSeeded();
  if (useMemory()) return mem.notificationState;
  const doc = (await Meta.findOne({ kind: 'notification-state' }))
    || (await Meta.create({ kind: 'notification-state', data: { read: {} } }));
  return { doc, read: doc.data?.read || {} };
}

async function persistNotificationState(state) {
  if (useMemory()) {
    mem.notificationState = state;
    return;
  }
  const holder = await notificationState();
  holder.doc.data = { ...(holder.doc.data || {}), read: state };
  holder.doc.markModified('data');
  await holder.doc.save();
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
    const holder = await notificationState();
    const read = useMemory() ? holder : holder.read;
    read[id] = true;
    await persistNotificationState(read);
    return { id, read: true };
  },

  async markAllRead() {
    const list = await notifications.list();
    const holder = await notificationState();
    const read = useMemory() ? holder : holder.read;
    list.forEach((item) => { read[item.id] = true; });
    await persistNotificationState(read);
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

function backupOwnerProof() {
  return crypto.createHmac('sha256', authSecret()).update(`backup:${requireTenantId()}`).digest('hex');
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
        app: 'PathoNexa', version: 2, owner: backupOwnerProof(),
        exportedAt: new Date().toISOString(), storage: useMemory() ? 'memory' : 'mongodb',
      },
      patients: await patients.list(), reports: await reports.list(),
      settings: await settings.get(), subscription: await subscription.get(),
      notificationRead, sequences: await sequenceState(),
    };
    for (const kind of COLLECTIONS) data[kind] = await all(kind); // eslint-disable-line no-restricted-syntax
    data.deleted = await meta.deleted();
    return data;
  },

  async restore(payload) {
    if (!payload || typeof payload !== 'object' || payload.meta?.app !== 'PathoNexa' || payload.meta?.version !== 2) {
      throw Object.assign(new Error('A valid PathoNexa backup is required'), { status: 400 });
    }
    const suppliedOwner = Buffer.from(String(payload.meta.owner || ''));
    const expectedOwner = Buffer.from(backupOwnerProof());
    if (suppliedOwner.length !== expectedOwner.length || !crypto.timingSafeEqual(suppliedOwner, expectedOwner)) {
      throw Object.assign(new Error('This backup belongs to a different account'), { status: 403 });
    }

    const hasPatients = Array.isArray(payload.patients);
    const hasReports = Array.isArray(payload.reports);
    const incomingPatients = hasPatients ? payload.patients.slice(0, 100000) : await patients.list();
    if (hasPatients && incomingPatients.length !== payload.patients.length) throw Object.assign(new Error('Backup is too large'), { status: 413 });

    const preparedPatients = incomingPatients.map((item) => ({
      ...pick(item, ['pid', ...PATIENT_FIELDS]),
      name: String(item?.name || '').trim(), mobile: String(item?.mobile || '').trim(),
      age: num(item?.age), gender: item?.gender,
      pid: String(item?.pid || '').trim(),
      _sourceKeys: [item?._id, item?.id, item?.pid].filter(Boolean).map(String),
    }));
    preparedPatients.forEach((item) => {
      if (!item.pid || !item.name || !/^[6-9]\d{9}$/.test(item.mobile) || !['Male', 'Female', 'Other'].includes(item.gender)) {
        throw Object.assign(new Error('Backup contains an invalid patient'), { status: 400 });
      }
    });
    validateUnique(preparedPatients, 'pid', 'patient IDs');
    validateUnique(preparedPatients, 'mobile', 'patient mobile numbers');

    const sourcePatientIndex = new Map();
    preparedPatients.forEach((item, index) => item._sourceKeys.forEach((key) => sourcePatientIndex.set(key, index)));
    const preparedReports = (hasReports ? payload.reports : []).map((item) => {
      const sourceIndex = reportPatientKeys(item?.patient).map((key) => sourcePatientIndex.get(key)).find((value) => value !== undefined);
      if (sourceIndex === undefined) throw Object.assign(new Error('Backup report references an unavailable patient'), { status: 400 });
      const report = {
        ...pick(item, ['reportId', ...REPORT_FIELDS]),
        reportId: String(item?.reportId || '').trim(), test: String(item?.test || '').trim(), amount: num(item?.amount),
        _sourcePatientIndex: sourceIndex,
      };
      if (!report.reportId || !report.test || report.amount < 0) throw Object.assign(new Error('Backup contains an invalid report'), { status: 400 });
      return report;
    });
    validateUnique(preparedReports, 'reportId', 'report IDs');

    const counts = {};
    let restoredPatients;
    if (hasPatients) {
      if (useMemory()) {
        mem.patients = preparedPatients.map(({ _sourceKeys, ...item }) => ({ ...item, _id: makeId(), createdAt: new Date(), updatedAt: new Date() }));
        restoredPatients = mem.patients;
        // Replacing patients invalidates reports unless reports are restored too.
        mem.reports = [];
      } else {
        await Report.deleteMany({});
        await Patient.deleteMany({});
        restoredPatients = await Patient.insertMany(preparedPatients.map(({ _sourceKeys, ...item }) => item));
      }
      counts.patients = restoredPatients.length;
    } else {
      restoredPatients = incomingPatients;
    }

    if (hasReports) {
      const records = preparedReports.map(({ _sourcePatientIndex, ...item }) => ({
        ...item,
        patient: useMemory() ? restoredPatients[_sourcePatientIndex] : restoredPatients[_sourcePatientIndex]._id,
      }));
      if (useMemory()) {
        mem.reports = records.map((item) => ({ ...item, _id: makeId(), createdAt: new Date(), updatedAt: new Date() }));
      } else {
        if (!hasPatients) await Report.deleteMany({});
        await Report.insertMany(records);
      }
      counts.reports = records.length;
    } else if (hasPatients) counts.reports = 0;

    if (hasPatients) await setSequenceAtLeast('patient', Math.max(maxSequence(preparedPatients, 'pid'), num(payload.sequences?.patient)));
    if (hasReports) await setSequenceAtLeast('report', Math.max(maxSequence(preparedReports, 'reportId'), num(payload.sequences?.report)));

    for (const kind of COLLECTIONS) {
      if (!Array.isArray(payload[kind])) continue;
      const records = payload[kind].slice(0, 100000).map(({ _id, id, ownerId, createdAt, updatedAt, ...data }) => data);
      if (records.length !== payload[kind].length) throw Object.assign(new Error('Backup is too large'), { status: 413 });
      if (useMemory()) mem[kind] = records.map((data) => ({ ...data, _id: makeId(), id: makeId(), createdAt: new Date(), updatedAt: new Date() }));
      else {
        await Meta.deleteMany({ kind }); // tenant plugin makes this account-local
        if (records.length) await Meta.insertMany(records.map((data) => ({ kind, data })));
      }
      counts[kind] = records.length;
    }

    if (payload.settings && typeof payload.settings === 'object') await settings.update(payload.settings);
    if (payload.subscription && typeof payload.subscription === 'object') {
      if (useMemory()) mem.subscription = payload.subscription;
      else {
        const doc = (await Meta.findOne({ kind: 'subscription' })) || await Meta.create({ kind: 'subscription', data: {} });
        doc.data = payload.subscription; doc.markModified('data'); await doc.save();
      }
    }
    if (payload.notificationRead && typeof payload.notificationRead === 'object') await persistNotificationState(payload.notificationRead);
    return { restored: counts, storage: useMemory() ? 'memory' : 'mongodb' };
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
  backup, useMemory,
};
