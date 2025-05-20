const mongoose = require('mongoose');

// Grade Subdocument Schema
const gradeSchema = new mongoose.Schema({
  course: { type: Number, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true }
});

// Attendance Subdocument Schema
const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    required: true
  }
});

// ✅ Fee Status Subdocument Schema (semester-wise)
const feeStatusSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid',
    required: true
  }
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

  // ✅ Semester-wise Fee Tracking
  feeStatus: [feeStatusSchema],

  grades: [gradeSchema],
  attendance: [attendanceSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
