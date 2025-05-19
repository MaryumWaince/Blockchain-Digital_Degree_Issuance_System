// File: backend/models/Leave.js
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  did: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, required: true },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
