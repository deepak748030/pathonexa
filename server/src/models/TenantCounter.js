const mongoose = require('mongoose');
const tenantPlugin = require('../lib/tenantPlugin');

/** Atomic, account-scoped sequences for human-readable patient/report IDs. */
const tenantCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  value: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true });

tenantCounterSchema.plugin(tenantPlugin);
tenantCounterSchema.index({ ownerId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('TenantCounter', tenantCounterSchema);
