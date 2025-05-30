const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  degree: { type: String, required: true },
  cgpa: { type: Number, required: true },

  blockchainHash: { type: String },
  blockchainTx: { type: String }, // ✅ Add this to store transaction hash
  isHashStored: { type: Boolean, default: false }, // ✅ Optional tracking flag

  status: {
    type: String,
    enum: ['Pending', 'Issued'],
    default: 'Pending'
  },

  resultDeclarationDate: { type: Date, default: null },
  issuedOn: { type: Date },

  pdfGenerated: { type: Boolean, default: false },
  pdfUrl: { type: String },
  pdfPath: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Degree', degreeSchema);


