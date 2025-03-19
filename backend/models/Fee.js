const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  amount: { type: Number, required: true },
  semester: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending' or 'Paid'
  transactionHash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);

