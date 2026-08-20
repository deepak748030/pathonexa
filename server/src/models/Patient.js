const mongoose = require('mongoose');

const patientSchema = mongoose.Schema({
  pid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  blood: { type: String, default: '' },
  mobile: { type: String, required: true },
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
  color: { type: String, default: '#DBEAFE' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
