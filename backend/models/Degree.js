const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  degree: { type: String, required: true },
  cgpa: { type: Number, required: true },

  // Blockchain and IPFS related fields
  blockchainHash: { type: String }, // transaction hash after storing CID on blockchain
  ipfsHash: { type: String },       // IPFS CID (content identifier) for the degree PDF or JSON

  // Status and dates
  status: {
    type: String,
    enum: ['Pending', 'Issued'],
    default: 'Pending'
  },
  resultDeclarationDate: { type: Date, default: null },
  issuedOn: { type: Date },
  notification: { type: Boolean, default: false },

  // PDF generation info
  pdfGenerated: { type: Boolean, default: false },
  pdfUrl: { type: String },   // optional public URL or IPFS gateway URL (for QR code link)
  pdfPath: { type: String },  // local server path or internal storage

  // Optional: store QR code data URL or path (if you want)
  qrCodeUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Degree', degreeSchema);

