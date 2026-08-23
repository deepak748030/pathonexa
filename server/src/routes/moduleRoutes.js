const express = require('express');

const router = express.Router();
const store = require('../lib/store');

/* Doctors: enriched list + ledger --------------------------------------- */
router.get('/doctors/summary', async (req, res, next) => {
  try {
    res.json(await store.doctors.list());
  } catch (err) { next(err); }
});

router.get('/doctors/:id/ledger', async (req, res, next) => {
  try {
    res.json(await store.doctors.ledger(req.params.id));
  } catch (err) { next(err); }
});

/* Doctor commission module ---------------------------------------------- */
router.get('/commissions/summary', async (req, res, next) => {
  try {
    res.json(await store.commissions.summary());
  } catch (err) { next(err); }
});

router.post('/commissions/pay', async (req, res, next) => {
  try {
    res.status(201).json(await store.commissions.pay(req.body));
  } catch (err) { next(err); }
});

/* Payment ledger --------------------------------------------------------- */
router.get('/transactions/summary', async (req, res, next) => {
  try {
    res.json(await store.transactions.summary());
  } catch (err) { next(err); }
});

router.post('/transactions/collect', async (req, res, next) => {
  try {
    res.status(201).json(await store.transactions.collect(req.body));
  } catch (err) { next(err); }
});

/* Online payments (Razorpay) ------------------------------------------- */
router.post('/payments/order', async (req, res, next) => {
  try {
    res.status(201).json(await store.payments.order(req.body));
  } catch (err) { next(err); }
});

router.post('/payments/verify', async (req, res, next) => {
  try {
    res.status(200).json(await store.payments.verify(req.body));
  } catch (err) { next(err); }
});

/* Expenses --------------------------------------------------------------- */
router.get('/expenses/summary', async (req, res, next) => {
  try {
    res.json(await store.expenses.summary());
  } catch (err) { next(err); }
});

router.get('/expense-categories', (req, res) => res.json(store.expenses.categories()));

/* Analytics -------------------------------------------------------------- */
router.get('/analytics', async (req, res, next) => {
  try {
    res.json(await store.analytics.overview());
  } catch (err) { next(err); }
});

/* Settings --------------------------------------------------------------- */
router.get('/settings', async (req, res, next) => {
  try {
    res.json(await store.settings.get());
  } catch (err) { next(err); }
});

router.patch('/settings', async (req, res, next) => {
  try {
    res.json(await store.settings.update(req.body));
  } catch (err) { next(err); }
});

/* Subscription ----------------------------------------------------------- */
router.get('/subscription', async (req, res, next) => {
  try {
    res.json(await store.subscription.get());
  } catch (err) { next(err); }
});

router.get('/subscription/plans', (req, res) => res.json(store.subscription.plans()));

router.post('/subscription/subscribe', async (req, res, next) => {
  try {
    res.json(await store.subscription.subscribe(req.body?.planId || req.body?.plan));
  } catch (err) { next(err); }
});

/* Notifications ---------------------------------------------------------- */
router.get('/notifications', async (req, res, next) => {
  try {
    res.json(await store.notifications.list(req.query));
  } catch (err) { next(err); }
});

router.get('/notifications/count', async (req, res, next) => {
  try {
    res.json({ unread: await store.notifications.unreadCount() });
  } catch (err) { next(err); }
});

router.post('/notifications/read-all', async (req, res, next) => {
  try {
    res.json(await store.notifications.markAllRead());
  } catch (err) { next(err); }
});

router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    res.json(await store.notifications.markRead(req.params.id));
  } catch (err) { next(err); }
});

/* Backup ----------------------------------------------------------------- */
router.get('/backup/status', async (req, res, next) => {
  try {
    res.json(await store.backup.status());
  } catch (err) { next(err); }
});

router.get('/backup/export', async (req, res, next) => {
  try {
    res.json(await store.backup.export());
  } catch (err) { next(err); }
});

router.post('/backup/run', async (req, res, next) => {
  try {
    res.json(await store.backup.run());
  } catch (err) { next(err); }
});

router.post('/backup/restore', async (req, res, next) => {
  try {
    res.json(await store.backup.restore(req.body));
  } catch (err) { next(err); }
});

module.exports = router;
