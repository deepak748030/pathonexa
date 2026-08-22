const express = require('express');
const router = express.Router();
const store = require('../lib/store');

/**
 * GET  /api/reports     → list all reports (patient populated, newest first)
 * GET  /api/reports/:id → single report (by _id or reportId)
 * POST /api/reports     → create a report
 */
router.get('/', async (req, res, next) => {
  try {
    res.json(await store.reports.list(req.query));
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    res.json(await store.reports.stats());
  } catch (err) {
    next(err);
  }
});

router.get('/next-id', async (req, res, next) => {
  try {
    res.json({ reportId: await store.reports.nextReportId() });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await store.reports.getById(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    res.json(await store.reports.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await store.reports.create(req.body));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    res.status(201).json(await store.reports.duplicate(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/verify', async (req, res, next) => {
  try {
    res.json(await store.reports.verify(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    res.json(await store.reports.remove(req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
