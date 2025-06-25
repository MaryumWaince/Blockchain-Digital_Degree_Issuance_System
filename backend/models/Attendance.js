const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  did: { type: String, required: true },
  courseName: { type: String, required: true },
  semester: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent'], required: true },
  verifiedByFingerprint: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
