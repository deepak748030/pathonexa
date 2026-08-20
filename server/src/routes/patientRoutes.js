const express = require('express');
const router = express.Router();
const store = require('../lib/store');

/**
 * GET    /api/patients       → list all patients (newest first)
 * GET    /api/patients/stats → patient dashboard stats
 * GET    /api/patients/:id   → single patient (by _id or pid)
 * POST   /api/patients       → create a patient
 */
router.get('/', async (req, res, next) => {
  try {
    res.json(await store.patients.list());
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    res.json(await store.patients.stats());
  } catch (err) {
    next(err);
  }
});

router.get('/duplicates', async (req, res, next) => {
  try {
    res.json(await store.patients.duplicates());
  } catch (err) {
    next(err);
  }
});

router.post('/import', async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : req.body?.patients;
    res.status(201).json(await store.patients.importMany(rows));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await store.patients.getById(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await store.patients.create(req.body));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    res.json(await store.patients.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    res.json(await store.patients.remove(req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
