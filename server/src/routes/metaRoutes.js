const express = require('express');
const router = express.Router();
const store = require('../lib/store');

/**
 * GET /api/tests   → catalogue of available lab tests
 * GET /api/doctors → referring doctors list
 */
router.get('/tests', (req, res) => {
  res.json(store.meta.tests());
});

router.get('/doctors', (req, res) => {
  res.json(store.meta.doctors());
});

module.exports = router;
