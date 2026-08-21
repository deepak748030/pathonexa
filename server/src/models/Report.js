const mongoose = require('mongoose');
const tenantPlugin = require('../lib/tenantPlugin');

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, trim: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  test: { type: String, required: true },
  tests: { type: Array, default: [] },
  package: { type: String, default: '' },
  doctor: { type: String, default: 'Direct' },
  date: { type: String },
  time: { type: String },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Pending' },
  paid: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentMode: { type: String, default: 'Cash' },
  sampleDate: { type: String, default: '' },
  reportDate: { type: String, default: '' },
  remarks: { type: String, default: '' },
  technician: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: String, default: '' },
  commission: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  commissionPaid: { type: Boolean, default: false },
  transactionId: { type: String, default: '' },
  values: { type: Array, default: [] },
  parameters: { type: Array, default: [] },
}, { timestamps: true });

reportSchema.plugin(tenantPlugin);
reportSchema.index({ ownerId: 1, reportId: 1 }, { unique: true });
reportSchema.index({ ownerId: 1, patient: 1, createdAt: -1 });
reportSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
