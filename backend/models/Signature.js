// models/Signature.js
const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  role: { type: String, required: true }, // 'VC', 'Governor', etc.
  imagePath: { type: String, required: true },
});

module.exports = mongoose.model('Signature', signatureSchema);
