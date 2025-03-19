const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentDID: { type: String, required: true },
  course: { type: String, required: true },
  semester: { type: Number, required: true },
  grade: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'F'
  recordedBy: { type: String, required: true } // Faculty DID or Name
});

module.exports = mongoose.model('Grade', gradeSchema);

