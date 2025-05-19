const mongoose = require('mongoose');

const scheduleRequestSchema = new mongoose.Schema({
  facultyName: String,
  classId: String,
  oldDate: Date,
  newDate: Date,
  reason: String,
  approved: { type: Boolean, default: false }
});

module.exports = mongoose.model('ScheduleRequest', scheduleRequestSchema);

