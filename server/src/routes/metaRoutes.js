const express = require('express');
const router = express.Router();
const store = require('../lib/store');

const keys = ['tests', 'doctors', 'employees', 'centers', 'payments', 'discounts', 'templates'];

keys.forEach((key) => {
  router.get(`/${key}`, (req, res, next) => {
    try {
      res.json(store.meta[key].list());
    } catch (err) {
      next(err);
    }
  });
  router.post(`/${key}`, (req, res, next) => {
    try {
      res.status(201).json(store.meta[key].create(req.body));
    } catch (err) {
      next(err);
    }
  });
  router.delete(`/${key}/:id`, (req, res, next) => {
    try {
      res.json(store.meta[key].remove(req.params.id));
    } catch (err) {
      next(err);
    }
  });
});

router.get('/deleted', (req, res) => res.json(store.meta.deleted()));
router.get('/lab', (req, res) => res.json(store.meta.lab()));
router.patch('/lab', (req, res) => res.json(store.meta.updateLab(req.body)));

module.exports = router;
