const mongoose = require('mongoose');

const otpChallengeSchema = mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  requestedAt: { type: Date, required: true },
  attempts: { type: Number, required: true, default: 0, min: 0 },
}, { versionKey: false });

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
