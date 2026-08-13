/**
 * Unified data store for PathoNexa.
 *
 * Uses MongoDB (via mongoose models) when the connection is healthy,
 * and transparently falls back to an in-memory store when Mongo is not
 * configured / unreachable — so the API always responds and the app can
 * be tested locally with zero infrastructure.
 *
 * All route handlers talk to this module; they never touch models directly.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const User = require('../models/User');
const seed = require('./seedData');

/* ------------------------------------------------------------------ */
/* In-memory state                                                     */
/* ------------------------------------------------------------------ */

const mem = {
  patients: [],
  reports: [],
  users: [],
  tests: [],
  doctors: [],
  employees: [],
  centers: [],
  payments: [],
  discounts: [],
  templates: [],
  deleted: [],
  seeded: false,
};

const makeId = () => crypto.randomBytes(12).toString('hex');
const pad = (n, w = 3) => String(n).padStart(w, '0');

function genPid(now = new Date(), seq = 1) {
  const d = now;
  const ymd = `${String(d.getFullYear()).slice(-2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  return `PT${ymd}${pad(seq)}`;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000);
}

function withIds(list) {
  return list.map((item) => ({
    ...item,
    _id: item.id || makeId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function seedMemory() {
  if (mem.seeded) return;
  mem.seeded = true;
  // Catalogue only — patients & reports stay empty so the app shows YOUR records.
  mem.patients = [];
  mem.reports = [];
  mem.tests = withIds(seed.tests);
  mem.doctors = withIds(seed.doctors);
  mem.employees = withIds(seed.employees || []);
  mem.centers = withIds(seed.centers || []);
  mem.payments = withIds(seed.payments || []);
  mem.discounts = withIds(seed.discounts || []);
  mem.templates = withIds(seed.templates || []);
}

async function seedMongo() {
  // Do not auto-insert demo patients — only real records created in the app.
  return;
}

/* ------------------------------------------------------------------ */
/* Mode helpers                                                        */
/* ------------------------------------------------------------------ */

const useMemory = () => !db.isReady();

function ensureSeeded() {
  if (useMemory()) seedMemory();
}

async function ensureMongoSeeded() {
  if (!useMemory()) await seedMongo();
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

const OTP = '123456';
const signToken = (id) =>
  jwt.sign({ id: String(id) }, process.env.JWT_SECRET || 'pathonexa-dev-secret', { expiresIn: '30d' });

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
    let user;
    if (useMemory()) {
      user = mem.users.find((u) => u.mobile === mobile);
      if (!user) {
        user = { _id: makeId(), mobile, name: 'PathoNexa Admin', role: 'admin', createdAt: new Date() };
        mem.users.push(user);
      }
    } else {
      user = await User.findOne({ mobile });
      if (!user) user = await User.create({ mobile, name: 'PathoNexa Admin', role: 'admin' });
    }
    return {
      token: signToken(user._id),
      user: { mobile: user.mobile, name: user.name, role: user.role },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */

const patients = {
  async list() {
    ensureSeeded();
    if (useMemory()) {
      return [...mem.patients].sort((a, b) => b.createdAt - a.createdAt);
    }
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
    const p = await Patient.findOne({ $or: [{ _id: id }, { pid: id }] }).lean();
    if (!p) {
      const err = new Error('Patient not found');
      err.status = 404;
      throw err;
    }
    return p;
  },

  async stats() {
    ensureSeeded();
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    if (useMemory()) {
      const all = mem.patients;
      const newThisWeek = all.filter((p) => new Date(p.createdAt) >= weekAgo).length;
      const reportsThisWeek = mem.reports.filter((r) => new Date(r.createdAt) >= weekAgo);
      const collection = reportsThisWeek.reduce((s, r) => s + (r.amount || 0), 0);
      return [
        { label: 'Total Patients', value: all.length.toLocaleString('en-IN'), tone: 'primary' },
        { label: 'New This Week', value: newThisWeek.toLocaleString('en-IN'), tone: 'green' },
        { label: 'Tests This Week', value: reportsThisWeek.length.toLocaleString('en-IN'), tone: 'purple' },
        { label: 'This Week Collection', value: `₹${collection.toLocaleString('en-IN')}`, tone: 'orange' },
      ];
    }
    const [total, newThisWeek, testsThisWeek, weekReports] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ createdAt: { $gte: weekAgo } }),
      Report.countDocuments({ createdAt: { $gte: weekAgo } }),
      Report.find({ createdAt: { $gte: weekAgo } }).lean(),
    ]);
    const collection = weekReports.reduce((s, r) => s + (r.amount || 0), 0);
    return [
      { label: 'Total Patients', value: total.toLocaleString('en-IN'), tone: 'primary' },
      { label: 'New This Week', value: newThisWeek.toLocaleString('en-IN'), tone: 'green' },
      { label: 'Tests This Week', value: testsThisWeek.toLocaleString('en-IN'), tone: 'purple' },
      { label: 'This Week Collection', value: `₹${collection.toLocaleString('en-IN')}`, tone: 'orange' },
    ];
  },

  async create(data) {
    const { name, mobile, age, gender } = data || {};
    if (!name || !mobile || !age || !gender) {
      const err = new Error('Name, mobile, age and gender are required');
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
    const doc = await Patient.create({
      ...data,
      pid: genPid(new Date(), count + 1),
    });
    return doc.toObject();
  },
};

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

const reports = {
  async list() {
    ensureSeeded();
    if (useMemory()) {
      return [...mem.reports].sort((a, b) => b.createdAt - a.createdAt);
    }
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
    const r = await Report.findOne({ $or: [{ _id: id }, { reportId: id }] }).populate('patient').lean();
    if (!r) {
      const err = new Error('Report not found');
      err.status = 404;
      throw err;
    }
    return r;
  },

  async create(data) {
    const { reportId, patient, test, amount } = data || {};
    if (!reportId || !patient || !test || amount === undefined) {
      const err = new Error('reportId, patient, test and amount are required');
      err.status = 400;
      throw err;
    }
    ensureSeeded();
    if (useMemory()) {
      const p = mem.patients.find((x) => x._id === patient || x.pid === patient);
      if (!p) {
        const err = new Error('Patient not found');
        err.status = 400;
        throw err;
      }
      const doc = {
        ...data,
        _id: makeId(),
        patient: p,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mem.reports.unshift(doc);
      return doc;
    }
    const doc = await Report.create({ ...data, patient });
    return Report.populate(doc, { path: 'patient' });
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

function computeStats(list) {
  const start = startOfToday();
  const today = list.filter((r) => new Date(r.createdAt) >= start);
  const todayRevenue = today.reduce((s, r) => s + (r.amount || 0), 0);
  const pending = list.filter((r) => r.status === 'Pending');
  const pendingAmount = list.filter((r) => r.status === 'Pending' && !r.paid).reduce((s, r) => s + (r.amount || 0), 0);
  const commission = list.reduce((s, r) => s + Math.round((r.amount || 0) * 0.15), 0);
  return {
    today: today.length,
    todayRevenue,
    pending: pending.length,
    pendingAmount,
    commission,
    total: list.length,
  };
}

const dashboard = {
  async stats() {
    ensureSeeded();
    await ensureMongoSeeded();
    const list = useMemory() ? mem.reports : await Report.find().lean();
    const s = computeStats(list);
    const fmt = (n) => n.toLocaleString('en-IN');
    return [
      { key: 'reports', label: "Today's Reports", value: fmt(s.today), sub: `Total: ${fmt(s.total)}`, tone: 'primary' },
      { key: 'revenue', label: "Today's Revenue", value: `₹${fmt(s.todayRevenue)}`, sub: 'Total Collection', tone: 'green' },
      { key: 'pending', label: 'Pending Reports', value: fmt(s.pending), sub: 'Yet to Complete', tone: 'orange' },
      { key: 'amount', label: 'Pending Amount', value: `₹${fmt(s.pendingAmount)}`, sub: 'Unpaid Amount', tone: 'purple' },
      { key: 'commission', label: 'Doctor Commission', value: `₹${fmt(s.commission)}`, sub: '15% of billed', tone: 'primary' },
      { key: 'expense', label: "Today's Expense", value: '₹0', sub: 'Total Expense', tone: 'red' },
    ];
  },

  async chart() {
    ensureSeeded();
    await ensureMongoSeeded();
    const list = useMemory() ? mem.reports : await Report.find().lean();
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
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekReports = list.filter((r) => new Date(r.createdAt) >= weekStart);
    const totalReports = values.reduce((a, b) => a + b, 0);
    const totalRevenue = weekReports.reduce((s, r) => s + (r.amount || 0), 0);
    const avgPerDay = Math.round(totalReports / 7);
    return {
      labels,
      values,
      totalReports: String(totalReports),
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      avgPerDay: String(avgPerDay),
    };
  },
};

/* ------------------------------------------------------------------ */
/* Meta (tests & doctors)                                              */
/* ------------------------------------------------------------------ */

function collectionApi(key, required) {
  return {
    list() {
      ensureSeeded();
      return [...mem[key]];
    },
    create(data) {
      ensureSeeded();
      for (const f of required) {
        if (data == null || data[f] == null || data[f] === '') {
          const err = new Error(`${f} is required`);
          err.status = 400;
          throw err;
        }
      }
      const doc = { ...data, _id: makeId(), id: undefined, createdAt: new Date(), updatedAt: new Date() };
      doc.id = doc._id;
      mem[key].unshift(doc);
      return doc;
    },
    remove(id) {
      ensureSeeded();
      const i = mem[key].findIndex((x) => x._id === id || x.id === id);
      if (i < 0) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      const [removed] = mem[key].splice(i, 1);
      mem.deleted.unshift({ ...removed, kind: key, deletedAt: new Date() });
      return removed;
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
  deleted: () => {
    ensureSeeded();
    return [...mem.deleted];
  },
  lab: () => ({
    name: 'PathoNexa Diagnostics Pvt. Ltd.',
    city: 'Lucknow, Uttar Pradesh',
    labId: 'LAB123456',
    phone: '+91 98765 43210',
    email: 'care@pathonexa.in',
    address: '12, Vikas Nagar, Hazratganj, Lucknow, UP - 226001',
    pathologist: 'Dr. Rakesh Kumar, MD (Pathology)',
  }),
};

module.exports = { auth, patients, reports, dashboard, meta, useMemory };
