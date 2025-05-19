// File: models/Fee.js
const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  semester: { type: Number, required: true },
  degree: { type: String, required: true },
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], required: true }
});

module.exports = mongoose.model('Fee', feeSchema);


