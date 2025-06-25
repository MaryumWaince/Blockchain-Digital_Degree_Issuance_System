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

  // New fields for tracking CGPA, PDF, and blockchain data
  cgpa: { type: Number, default: 0 },
  pdfPath: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  ipfsHash: { type: String, default: '' },
  blockchainTxHash: { type: String, default: '' },

  // Optional: show if migrated to Degree.js
  migratedToDegree: { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DegreeRequest', degreeRequestSchema);
