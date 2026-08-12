const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().populate('patient').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const report = await Report.create(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
