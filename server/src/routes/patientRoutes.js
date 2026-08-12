const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = await Patient.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const Report = require('../models/Report');
    const testsThisWeek = await Report.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const reportsThisWeek = await Report.find({
      createdAt: { $gte: oneWeekAgo }
    });
    const collectionThisWeek = reportsThisWeek.reduce((sum, r) => sum + (r.amount || 0), 0);

    res.json([
      { label: 'Total Patients', value: totalPatients.toLocaleString(), tone: 'primary' },
      { label: 'New This Week', value: newThisWeek.toLocaleString(), tone: 'green' },
      { label: 'Tests This Week', value: testsThisWeek.toLocaleString(), tone: 'purple' },
      { label: 'This Week Collection', value: `₹${collectionThisWeek.toLocaleString()}`, tone: 'orange' },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, mobile, age, gender } = req.body;
    if (!name || !mobile || !age || !gender) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let existingPatient = await Patient.findOne({ mobile });
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this mobile number already exists' });
    }

    if (!req.body.pid) {
      const count = await Patient.countDocuments();
      req.body.pid = 'PT' + (count + 1000).toString();
    }

    const patient = new Patient(req.body);
    const savedPatient = await patient.save();
    
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;