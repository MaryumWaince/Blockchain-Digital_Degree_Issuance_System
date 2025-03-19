const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  degreeName: { type: String, required: true },
  issuedOn: { type: Date, default: Date.now },
  cgpa: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending' or 'Issued'
  blockchainHash: { type: String }
});

module.exports = mongoose.model('Degree', degreeSchema);

