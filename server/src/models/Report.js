const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  test: { type: String, required: true },
  doctor: { type: String },
  date: { type: String },
  time: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Pending' },
  paid: { type: Boolean, default: false },
  parameters: { type: Array },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
