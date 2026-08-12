const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock OTP verification for demo, ready for prod
router.post('/login', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });
  
  // In real prod, send OTP here
  res.status(200).json({ message: 'OTP sent successfully (Demo: 123456)' });
});

router.post('/verify', async (req, res) => {
  const { mobile, otp } = req.body;
  
  if (otp !== '123456') {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  try {
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile, name: 'PathoNexa Admin' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { mobile: user.mobile, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
