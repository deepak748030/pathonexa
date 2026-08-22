const mongoose = require('mongoose');
const tenantPlugin = require('../lib/tenantPlugin');

const patientSchema = new mongoose.Schema({
  pid: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 150 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  blood: { type: String, default: '' },
  mobile: { type: String, required: true, trim: true },
  altMobile: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  email: { type: String, default: '' },
  dob: { type: String, default: '' },
  remarks: { type: String, default: '' },
  referredBy: { type: String, default: '' },
  lastTest: { type: String, default: '' },
  lastTestDate: { type: String, default: '' },
  group: { type: String, default: '' },
  photo: { type: String, default: '' },
  color: { type: String, default: '#DBEAFE' },
}, { timestamps: true });

patientSchema.plugin(tenantPlugin);
patientSchema.index({ ownerId: 1, pid: 1 }, { unique: true });
patientSchema.index({ ownerId: 1, mobile: 1 }, { unique: true });
patientSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Patient', patientSchema);
