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
    res.json(await store.reports.list());
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

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await store.reports.create(req.body));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
