const mongoose = require('mongoose');

// Grade Subdocument Schema
const gradeSchema = new mongoose.Schema({
  course: { type: String, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true }
});

// Attendance Subdocument Schema
const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'leave'], required: true }
});

// Main Student Schema
const studentSchema = new mongoose.Schema({
  did: { type: String, unique: true, required: true },
  privateKey: { type: String, required: true },

  name: { type: String, required: true },
  cnic: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  degree: { type: String, required: true },
  batch: { type: String, required: true },

  feeStatus: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },

  grades: [gradeSchema],
  attendance: [attendanceSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
