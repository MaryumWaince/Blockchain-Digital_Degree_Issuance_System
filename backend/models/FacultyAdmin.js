const mongoose = require('mongoose');

const facultyAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  userType: { type: String, required: true } // "Faculty" or "Admin"
});

module.exports = mongoose.model('FacultyAdmin', facultyAdminSchema);

