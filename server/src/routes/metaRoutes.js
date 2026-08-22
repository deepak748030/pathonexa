const express = require('express');

const router = express.Router();
const store = require('../lib/store');
const { publicConfig } = require('../config/appConfig');

/* Business config (.env driven) --------------------------------------
 * Default commission %, max discount %, currency, trial days and plan
 * pricing — the app reads these instead of hard-coding values. */
router.get('/config', (req, res) => {
  res.json(publicConfig());
});

/**
 * Master data collections (tests, doctors, packages, expenses, …).
 * Every collection supports list / get / create / update / delete so the app
 * can manage each module from the "More" tab.
 */
const keys = [
  'tests', 'doctors', 'employees', 'centers', 'payments', 'discounts',
  'templates', 'packages', 'expenses', 'transactions', 'commissions',
  'drafts', 'labs', 'roles',
];
const immutableLedgers = new Set(['transactions', 'commissions']);

function rejectLedgerRewrite(key) {
  if (immutableLedgers.has(key)) {
    throw Object.assign(new Error('Financial ledger entries are immutable'), { status: 405 });
  }
}

keys.forEach((key) => {
  router.get(`/${key}`, async (req, res, next) => {
    try {
      // The transaction ledger has server-owned filtering/normalization that
      // must not be bypassed through the generic metadata route.
      const api = key === 'transactions' ? store.transactions : store.meta[key];
      res.json(await api.list(req.query));
    } catch (err) { next(err); }
  });

  router.get(`/${key}/:id`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].get(req.params.id));
    } catch (err) { next(err); }
  });

  router.post(`/${key}`, async (req, res, next) => {
    try {
      if (key === 'transactions') {
        throw Object.assign(
          new Error('Transaction entries must be created through a billing workflow'),
          { status: 405 },
        );
      }
      const api = key === 'commissions' ? { create: store.commissions.pay } : store.meta[key];
      res.status(201).json(await api.create(req.body));
    } catch (err) { next(err); }
  });

  router.patch(`/${key}/:id`, async (req, res, next) => {
    try {
      rejectLedgerRewrite(key);
      res.json(await store.meta[key].update(req.params.id, req.body));
    } catch (err) { next(err); }
  });

  router.put(`/${key}/:id`, async (req, res, next) => {
    try {
      rejectLedgerRewrite(key);
      res.json(await store.meta[key].update(req.params.id, req.body));
    } catch (err) { next(err); }
  });

  router.delete(`/${key}/:id`, async (req, res, next) => {
    try {
      rejectLedgerRewrite(key);
      res.json(await store.meta[key].remove(req.params.id));
    } catch (err) { next(err); }
  });
});

/* Deleted records bin ------------------------------------------------ */
router.get('/deleted', async (req, res, next) => {
  try {
    res.json(await store.meta.deleted(req.query));
  } catch (err) { next(err); }
});

router.post('/deleted/:id/restore', async (req, res, next) => {
  try {
    res.json(await store.meta.restore(req.params.id));
  } catch (err) { next(err); }
});

/* Lab profile (alias of settings) ------------------------------------ */
router.get('/lab', async (req, res, next) => {
  try {
    res.json(await store.meta.lab());
  } catch (err) { next(err); }
});

router.patch('/lab', async (req, res, next) => {
  try {
    res.json(await store.meta.updateLab(req.body));
  } catch (err) { next(err); }
});

/* Roles & permissions ------------------------------------------------ */
router.get('/roles-matrix', async (req, res, next) => {
  try {
    res.json({ roles: await store.roles.list(), permissions: store.roles.permissions() });
  } catch (err) { next(err); }
});

module.exports = router;
