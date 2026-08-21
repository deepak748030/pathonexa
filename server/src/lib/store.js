/**
 * Unified data store for PathoNexa.
 *
 * Uses MongoDB (via mongoose models) when the connection is healthy, and
 * transparently falls back to an in-memory store when Mongo is not configured
 * or unreachable — so the API always responds and the app can be tested
 * locally with zero infrastructure.
 *
 * All route handlers talk to this module; they never touch models directly.
 *
 * Modules implemented here (mirroring the PathoNexa specification):
 *   auth · patients · reports · dashboard · meta (masters) · doctors ledger
 *   commissions · transactions (payment ledger) · expenses summary · analytics
 *   notifications · subscription · settings · backup · roles
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const User = require('../models/User');
const Meta = require('../models/Meta');
const seed = require('./seedData');

/* ------------------------------------------------------------------ */
/* In-memory state                                                     */
/* ------------------------------------------------------------------ */

const COLLECTIONS = [
  'tests', 'doctors', 'employees', 'centers', 'payments', 'discounts',
  'templates', 'packages', 'expenses', 'transactions', 'commissions',
  'drafts', 'labs', 'roles',
];

const mem = {
  patients: [],
  reports: [],
  users: [],
  deleted: [],
  notificationState: {},
  settings: null,
  subscription: null,
  seeded: false,
};
COLLECTIONS.forEach((k) => { mem[k] = []; });

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
  const d = now;
  const ymd = `${String(d.getFullYear()).slice(-2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  return `PT${ymd}${pad(seq)}`;
}

function genReportId(seq = 1, now = new Date()) {
  const ymd = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  return `RP${ymd}${pad(seq)}`;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000);
}

function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 3600 * 1000);
}

function dateLabel(d = new Date()) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeLabel(d = new Date()) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function withIds(list) {
  return (list || []).map((item, i) => ({
    ...item,
    _id: makeId(),
    id: undefined,
    seedId: item.id,
    createdAt: hoursAgo(i),
    updatedAt: hoursAgo(i),
  })).map((x) => ({ ...x, id: x._id }));
}

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

function defaultSubscription() {
  const startedAt = daysAgo(2);
  const expiresAt = new Date(startedAt.getTime() + 7 * 24 * 3600 * 1000);
  return { ...seed.subscription, startedAt, expiresAt, history: [] };
}

function seedMemory() {
  if (mem.seeded) return;
  mem.seeded = true;
  mem.patients = (seed.patients || []).map((p, i) => ({
    ...p,
    _id: makeId(),
    pid: genPid(new Date(), i + 1),
    createdAt: hoursAgo(i * 6),
    updatedAt: hoursAgo(i * 6),
  }));
  mem.reports = (seed.reports || []).map((r, i) => {
    const p = mem.patients[r.patientIndex] || mem.patients[0];
    return {
      ...r,
      _id: makeId(),
      patient: p,
      color: p?.color,
      createdAt: hoursAgo(Math.min(i, 5) * 2),
      updatedAt: hoursAgo(Math.min(i, 5) * 2),
    };
  });
  COLLECTIONS.forEach((k) => { mem[k] = withIds(seed[k] || []); });
  mem.settings = { ...seed.settings };
  mem.subscription = defaultSubscription();

  // Seed the payment ledger from the demo reports so the module is never empty.
  mem.transactions = mem.reports
    .filter((r) => num(r.paidAmount) > 0)
    .map((r, i) => ({
      _id: makeId(),
      txnId: `TXN${Date.now().toString().slice(-6)}${i}`,
      reportId: r.reportId,
      report: r._id,
      patient: r.patient?.name,
      patientId: r.patient?._id,
      amount: num(r.paidAmount),
      mode: r.paymentMode || 'Cash',
      type: 'Collection',
      note: 'Report billing',
      date: r.date,
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
    }));
}

async function seedMongo() {
  // Master data is seeded once so a fresh database is immediately usable.
  const existing = await Meta.countDocuments();
  if (existing > 0) return;
  const docs = [];
  COLLECTIONS.forEach((kind) => {
    (seed[kind] || []).forEach((item) => docs.push({ kind, data: { ...item, id: undefined } }));
  });
  docs.push({ kind: 'settings', data: { ...seed.settings } });
  docs.push({ kind: 'subscription', data: defaultSubscription() });
  if (docs.length) await Meta.insertMany(docs);
}

/* ------------------------------------------------------------------ */
/* Mode helpers                                                        */
/* ------------------------------------------------------------------ */

const useMemory = () => !db.isReady();

function ensureSeeded() {
  if (useMemory()) seedMemory();
}

let mongoSeedPromise = null;
async function ensureMongoSeeded() {
  if (useMemory()) return;
  if (!mongoSeedPromise) mongoSeedPromise = seedMongo().catch((e) => {
    mongoSeedPromise = null;
    console.warn('[store] mongo seed failed:', e.message);
  });
  await mongoSeedPromise;
}

/** Loads every record of a master collection, whichever backend is active. */
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

/* ------------------------------------------------------------------ */
/* Auth & roles                                                        */
/* ------------------------------------------------------------------ */

const OTP = '123456';
const signToken = (id) =>
  jwt.sign({ id: String(id) }, process.env.JWT_SECRET || 'pathonexa-dev-secret', { expiresIn: '30d' });

function permissionsFor(roleName) {
  const role = (seed.roles || []).find((r) => r.name.toLowerCase() === String(roleName || '').toLowerCase());
  return role ? role.permissions : (seed.roles[1]?.permissions || []);
}

const auth = {
  async login(mobile) {
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      const err = new Error('A valid 10-digit mobile number is required');
      err.status = 400;
      throw err;
    }
    return { message: `OTP sent to +91 ${mobile} (demo OTP: ${OTP})` };
  },

  async verify(mobile, otp) {
    if (!mobile || !otp) {
      const err = new Error('Mobile number and OTP are required');
      err.status = 400;
      throw err;
    }
    if (otp !== OTP) {
      const err = new Error('Invalid OTP. The demo OTP is 123456.');
      err.status = 400;
      throw err;
    }
    ensureSeeded();

    // A staff member registered under Lab Employees signs in with their role.
    const staff = (await all('employees')).find((e) => e.mobile === mobile);
    const name = staff?.name || 'Ravi Sharma';
    const role = staff?.role || 'Lab Owner';

    let user;
    if (useMemory()) {
      user = mem.users.find((u) => u.mobile === mobile);
      if (!user) {
        user = { _id: makeId(), mobile, name, role, createdAt: new Date() };
        mem.users.push(user);
      } else {
        user.name = name;
        user.role = role;
      }
    } else {
      user = await User.findOne({ mobile });
      if (!user) user = await User.create({ mobile, name, role });
      else if (user.role !== role || user.name !== name) {
        user.role = role;
        user.name = name;
        await user.save();
      }
    }
    return {
      token: signToken(user._id),
      user: {
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        permissions: permissionsFor(user.role),
      },
    };
  },
};

const roles = {
  async list() {
    const custom = await all('roles');
    if (custom.length) return custom;
    return seed.roles;
  },
  permissions: () => seed.PERMISSIONS,
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
  async list() {
    ensureSeeded();
    if (useMemory()) return [...mem.patients].sort((a, b) => b.createdAt - a.createdAt);
    await ensureMongoSeeded();
    return Patient.find().sort({ createdAt: -1 }).lean();
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
        pid: genPid(new Date(), mem.patients.length + 1),
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
    const count = await Patient.countDocuments();
    const doc = await Patient.create({ ...data, pid: genPid(new Date(), count + 1) });
    return doc.toObject();
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
  return num(doc?.commission);
}

const reports = {
  async list() {
    ensureSeeded();
    if (useMemory()) return [...mem.reports].sort((a, b) => b.createdAt - a.createdAt);
    await ensureMongoSeeded();
    return Report.find().populate('patient').sort({ createdAt: -1 }).lean();
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
    const list = await allReports();
    return genReportId(list.length + 1);
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
    payload.commissionRate = rate;
    payload.commission = Math.round((num(payload.amount) * rate) / 100);
    payload.commissionPaid = payload.commissionPaid || false;
    payload.date = payload.date || dateLabel();
    payload.time = payload.time || timeLabel();

    let doc;
    if (useMemory()) {
      const p = mem.patients.find((x) => x._id === patient || x.pid === patient);
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 400;
        throw err;
      }
      doc = { ...payload, _id: makeId(), patient: p, createdAt: new Date(), updatedAt: new Date() };
      p.lastTest = payload.test;
      p.lastTestDate = payload.date;
      mem.reports.unshift(doc);
    } else {
      const created = await Report.create({ ...payload, patient });
      await Patient.findOneAndUpdate(byIdOrPid(String(patient)), {
        $set: { lastTest: payload.test, lastTestDate: payload.date },
      });
      doc = (await Report.findById(created._id).populate('patient').lean());
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

const meta = {
  tests: collectionApi('tests', ['name', 'price']),
  doctors: collectionApi('doctors', ['name']),
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
    if (useMemory()) return { ...(mem.settings || seed.settings) };
    await ensureMongoSeeded();
    const doc = await Meta.findOne({ kind: 'settings' });
    if (!doc) {
      const created = await Meta.create({ kind: 'settings', data: { ...seed.settings } });
      return { ...created.data };
    }
    return { ...seed.settings, ...doc.data };
  },
  async update(patch) {
    ensureSeeded();
    if (useMemory()) {
      mem.settings = { ...(mem.settings || seed.settings), ...(patch || {}) };
      return { ...mem.settings };
    }
    const doc = (await Meta.findOne({ kind: 'settings' })) || (await Meta.create({ kind: 'settings', data: { ...seed.settings } }));
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
  categories: () => seed.EXPENSE_CATEGORIES,

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
      categories: seed.EXPENSE_CATEGORIES,
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
  plans: () => seed.plans,

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
      plans: seed.plans,
    };
  },

  async subscribe(planId) {
    const plan = (seed.plans || []).find((p) => p.id === planId);
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

const notifications = {
  async list() {
    const reportList = await allReports();
    const sub = await subscription.get();
    const wallet = await commissions.summary();
    const out = [];

    reportList
      .filter((r) => r.status === 'Completed' && !r.notified)
      .slice(0, 10)
      .forEach((r) => out.push({
        id: `ready-${r._id}`,
        type: 'Report Ready',
        tone: 'green',
        title: `Report ready · ${r.test}`,
        subtitle: `${r.patient?.name || 'Patient'} · ${r.reportId}`,
        reportId: String(r._id),
        at: r.updatedAt || r.createdAt,
      }));

    reportList
      .filter((r) => num(r.pendingAmount ?? (r.paid ? 0 : r.amount)) > 0)
      .slice(0, 20)
      .forEach((r) => out.push({
        id: `pay-${r._id}`,
        type: 'Payment Pending',
        tone: 'orange',
        title: `Payment pending · ${inr(num(r.pendingAmount ?? r.amount))}`,
        subtitle: `${r.patient?.name || 'Patient'} · ${r.reportId}`,
        reportId: String(r._id),
        at: r.createdAt,
      }));

    if (wallet.pendingCommission > 0) {
      out.push({
        id: 'commission-due',
        type: 'Doctor Commission Due',
        tone: 'purple',
        title: `Commission payout due · ${inr(wallet.pendingCommission)}`,
        subtitle: `${wallet.doctors.filter((d) => d.pendingCommission > 0).length} doctors waiting`,
        at: new Date(),
      });
    }

    if (sub.daysLeft <= 7) {
      out.push({
        id: 'subscription',
        type: 'Subscription Expiry',
        tone: sub.daysLeft > 0 ? 'orange' : 'red',
        title: sub.daysLeft > 0
          ? `${sub.plan} expires in ${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'}`
          : `${sub.plan} has expired`,
        subtitle: 'Renew to keep cloud backup and WhatsApp sharing active',
        at: new Date(),
      });
    }

    const read = mem.notificationState;
    return out
      .map((n) => ({ ...n, read: !!read[n.id] }))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  },

  async markRead(id) {
    mem.notificationState[id] = true;
    return { id, read: true };
  },

  async markAllRead() {
    const list = await notifications.list();
    list.forEach((n) => { mem.notificationState[n.id] = true; });
    return { read: list.length };
  },

  async unreadCount() {
    const list = await notifications.list();
    return list.filter((n) => !n.read).length;
  },
};

/* ------------------------------------------------------------------ */
/* Backup & restore                                                    */
/* ------------------------------------------------------------------ */

const backup = {
  async export() {
    ensureSeeded();
    const data = {
      meta: {
        app: 'PathoNexa',
        version: 1,
        exportedAt: new Date().toISOString(),
        storage: useMemory() ? 'memory' : 'mongodb',
      },
      patients: await patients.list(),
      reports: await reports.list(),
      settings: await settings.get(),
      subscription: await subscription.get(),
    };
    for (const kind of COLLECTIONS) {
      // eslint-disable-next-line no-await-in-loop
      data[kind] = await all(kind);
    }
    data.deleted = await meta.deleted();
    return data;
  },

  async restore(payload) {
    if (!payload || typeof payload !== 'object') {
      const err = new Error('A backup JSON body is required');
      err.status = 400;
      throw err;
    }
    ensureSeeded();
    const counts = {};
    if (useMemory()) {
      if (Array.isArray(payload.patients)) {
        mem.patients = payload.patients.map((p) => ({ ...p, _id: p._id || makeId(), createdAt: new Date(p.createdAt || Date.now()) }));
        counts.patients = mem.patients.length;
      }
      if (Array.isArray(payload.reports)) {
        mem.reports = payload.reports.map((r) => ({ ...r, _id: r._id || makeId(), createdAt: new Date(r.createdAt || Date.now()) }));
        counts.reports = mem.reports.length;
      }
      COLLECTIONS.forEach((kind) => {
        if (Array.isArray(payload[kind])) {
          mem[kind] = payload[kind].map((x) => ({ ...x, _id: x._id || makeId() }));
          counts[kind] = mem[kind].length;
        }
      });
      if (payload.settings) mem.settings = { ...seed.settings, ...payload.settings };
      if (payload.subscription) mem.subscription = payload.subscription;
      return { restored: counts, storage: 'memory' };
    }

    if (Array.isArray(payload.patients)) {
      await Patient.deleteMany({});
      await Patient.insertMany(payload.patients.map(({ _id, ...p }) => p));
      counts.patients = payload.patients.length;
    }
    if (Array.isArray(payload.reports)) {
      await Report.deleteMany({});
      counts.reports = payload.reports.length;
    }
    for (const kind of COLLECTIONS) {
      if (Array.isArray(payload[kind])) {
        // eslint-disable-next-line no-await-in-loop
        await Meta.deleteMany({ kind });
        // eslint-disable-next-line no-await-in-loop
        await Meta.insertMany(payload[kind].map(({ _id, ...data }) => ({ kind, data })));
        counts[kind] = payload[kind].length;
      }
    }
    if (payload.settings) await settings.update(payload.settings);
    return { restored: counts, storage: 'mongodb' };
  },

  async status() {
    const data = {
      patients: (await patients.list()).length,
      reports: (await reports.list()).length,
      tests: (await all('tests')).length,
      doctors: (await all('doctors')).length,
      transactions: (await all('transactions')).length,
      expenses: (await all('expenses')).length,
    };
    const s = await settings.get();
    return {
      storage: useMemory() ? 'In-memory (demo)' : 'MongoDB (cloud)',
      autoBackup: !!s.autoBackup,
      lastBackupAt: mem.lastBackupAt || null,
      records: data,
      totalRecords: Object.values(data).reduce((a, b) => a + b, 0),
    };
  },

  async run() {
    mem.lastBackupAt = new Date();
    const snapshot = await backup.export();
    return { ok: true, at: mem.lastBackupAt, records: Object.keys(snapshot).length };
  },
};

module.exports = {
  auth, roles, patients, reports, dashboard, meta, settings, transactions,
  doctors, commissions, expenses, analytics, subscription, notifications,
  backup, useMemory,
};
