const mongoose = require('mongoose');

/**
 * Generic persistence bucket for the "master data" collections
 * (tests, doctors, packages, expenses, transactions, …).
 *
 * Using one polymorphic collection keeps the API surface small while still
 * giving every module real MongoDB persistence when a database is configured.
 */
const metaSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meta', metaSchema);
