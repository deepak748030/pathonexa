const mongoose = require('mongoose');
const tenantPlugin = require('../lib/tenantPlugin');

/** Tenant-owned persistence bucket for master data and account state. */
const metaSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

metaSchema.plugin(tenantPlugin);
metaSchema.index({ ownerId: 1, kind: 1, createdAt: -1 });

module.exports = mongoose.model('Meta', metaSchema);
