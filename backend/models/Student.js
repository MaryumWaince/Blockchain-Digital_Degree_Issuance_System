const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true },
  email: { type: String, required: true },
  degree: { type: String, required: true },
  batch: { type: String, required: true },
  did: { type: String, required: true },
  privateKey: { type: String, required: true },
  encryptedData: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
