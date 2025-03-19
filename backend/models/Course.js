const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  semester: { type: Number, required: true },
  courses: [{ type: String, required: true }],
});

module.exports = mongoose.model('Course', courseSchema);

