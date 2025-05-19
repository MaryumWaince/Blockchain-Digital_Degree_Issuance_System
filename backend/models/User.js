const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, required: true },
  userType: { type: String, enum: ['faculty', 'admin'], required: true }
});

module.exports = mongoose.model('User', userSchema);
