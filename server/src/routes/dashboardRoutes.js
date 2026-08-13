const express = require('express');
const router = express.Router();
const store = require('../lib/store');

/**
 * GET /api/dashboard/stats → six headline stat cards
 * GET /api/dashboard/chart → last-7-days report counts + totals
 */
router.get('/stats', async (req, res, next) => {
  try {
    res.json(await store.dashboard.stats());
  } catch (err) {
    next(err);
  }
});

router.get('/chart', async (req, res, next) => {
  try {
    res.json(await store.dashboard.chart());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
