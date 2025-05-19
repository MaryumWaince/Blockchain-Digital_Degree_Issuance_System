const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  courseName: { type: String, required: true },
  semester: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  grade: { type: String, required: true },
  qualityPoints: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);



