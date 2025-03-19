const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, required: true }, // 'Present' or 'Absent'
  fingerprintHash: { type: String, required: true }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
