const mongoose = require('mongoose');

const fingerprintSchema = new mongoose.Schema({
  did: { type: String, required: true, unique: true },
  fingerprintHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Fingerprint', fingerprintSchema);

