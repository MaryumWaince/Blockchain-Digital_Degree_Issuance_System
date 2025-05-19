const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  semester: { type: Number, required: true },
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true },
  creditHours: { type: Number, required: true },
  totalMarks: { type: Number, required: true }
});

module.exports = mongoose.model('Course', courseSchema);
