const mongoose = require('mongoose');

const patientSchema = mongoose.Schema({
  pid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  blood: { type: String, default: '' },
  mobile: { type: String, required: true },
  address: { type: String, default: '' },
  lastTest: { type: String, default: '' },
  lastTestDate: { type: String, default: '' },
  color: { type: String, default: '#DBEAFE' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
