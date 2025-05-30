const mongoose = require('mongoose');

// Grade Subdocument Schema
const gradeSchema = new mongoose.Schema({
  course: { type: Number, required: true },
  courseName: { type: String }, // Optional, if needed for display
  semester: { type: String, required: true },
  grade: { type: String, required: true },
  totalMarks: { type: Number },
  obtainedMarks: { type: Number },
  creditHours: { type: Number },
  qualityPoints: { type: Number }
});

// Attendance Subdocument Schema
const attendanceSchema = new mongoose.Schema({
  course: { type: Number, required: true },
  courseName: { type: String },
  semester: { type: String, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    required: true
  }
});

// Fee Status Subdocument Schema (semester-wise)
const feeStatusSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid',
    required: true
  }
});

// Reenrollment Request Schema
const reenrollmentSchema = new mongoose.Schema({
  semester: { type: String, required: true },
  courses: [
    {
      courseCode: { type: Number, required: true },
      courseName: { type: String }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  decisionDate: { type: Date }
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

  fingerprintHash: { type: String }, // ✅ for biometric attendance

  feeStatus: [feeStatusSchema], // Semester-wise Fee Tracking
  grades: [gradeSchema],
  attendance: [attendanceSchema],
  reenrollmentRequests: [reenrollmentSchema],

  gpaBySemester: {
    type: Map,
    of: Number // e.g., { "1": 3.4, "2": 3.7 }
  },
  cgpa: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
