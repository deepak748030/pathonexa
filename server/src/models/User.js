const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  name: { type: String },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
