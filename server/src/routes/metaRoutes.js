const express = require('express');

const router = express.Router();
const store = require('../lib/store');

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

keys.forEach((key) => {
  router.get(`/${key}`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].list());
    } catch (err) { next(err); }
  });

  router.get(`/${key}/:id`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].get(req.params.id));
    } catch (err) { next(err); }
  });

  router.post(`/${key}`, async (req, res, next) => {
    try {
      res.status(201).json(await store.meta[key].create(req.body));
    } catch (err) { next(err); }
  });

  router.patch(`/${key}/:id`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].update(req.params.id, req.body));
    } catch (err) { next(err); }
  });

  router.put(`/${key}/:id`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].update(req.params.id, req.body));
    } catch (err) { next(err); }
  });

  router.delete(`/${key}/:id`, async (req, res, next) => {
    try {
      res.json(await store.meta[key].remove(req.params.id));
    } catch (err) { next(err); }
  });
});

/* Deleted records bin ------------------------------------------------ */
router.get('/deleted', async (req, res, next) => {
  try {
    res.json(await store.meta.deleted());
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
