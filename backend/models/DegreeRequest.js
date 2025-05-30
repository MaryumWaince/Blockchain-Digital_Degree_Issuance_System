// models/DegreeRequest.js
const mongoose = require('mongoose');

const degreeRequestSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  remark: { type: String, default: '' },
  approvedAt: { type: Date },
  pdfPath: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DegreeRequest', degreeRequestSchema);

