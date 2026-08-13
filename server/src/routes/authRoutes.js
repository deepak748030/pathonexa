const express = require('express');
const router = express.Router();
const store = require('../lib/store');

/**
 * POST /api/auth/login  → accepts a 10-digit mobile, returns demo OTP notice
 * POST /api/auth/verify → accepts { mobile, otp }, returns { token, user }
 */
router.post('/login', async (req, res, next) => {
  try {
    res.status(200).json(await store.auth.login(req.body.mobile));
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    res.status(200).json(await store.auth.verify(mobile, otp));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
