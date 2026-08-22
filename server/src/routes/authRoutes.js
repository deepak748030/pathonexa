const express = require('express');
const router = express.Router();
const store = require('../lib/store');
const { requireAuth } = require('../middleware/auth');

router.post('/login', async (req, res, next) => {
  try {
    res.status(200).json(await store.auth.login(req.body?.mobile));
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { mobile, otp } = req.body || {};
    res.status(200).json(await store.auth.verify(mobile, otp));
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    res.status(200).json(await store.auth.me(req.auth.id));
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    res.status(200).json(await store.auth.updateProfile(req.auth.id, req.body));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
