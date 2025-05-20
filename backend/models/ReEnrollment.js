const mongoose = require('mongoose');

// Embedded sub-schema for courses (optional: could just use [String])
const CourseSchema = new mongoose.Schema({
  courseName: { type: String, required: true }
});

const ReEnrollmentSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  semester: { type: Number, required: true },
  reason: { type: String, required: true },
  courses: [CourseSchema], // storing courses as array of objects with courseName
  status: {
    type: String,
    enum: ['pending', 'Approved', 'Rejected'], // good practice to restrict values
    default: 'pending'
  },
  approvedByHOD: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReEnrollment', ReEnrollmentSchema);
