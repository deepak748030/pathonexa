const mongoose = require('mongoose');

const patientSchema = mongoose.Schema({
  pid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  blood: { type: String },
  mobile: { type: String, required: true },
  color: { type: String, default: '#DBEAFE' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
