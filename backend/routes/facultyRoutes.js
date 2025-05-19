// ✅ File: routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Mark Attendance
router.post('/attendance/:did', async (req, res) => {
  const { date, status } = req.body;
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.attendance.push({ date, status });
    await student.save();

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit Grade
router.post('/grade/:did', async (req, res) => {
  const { course, semester, grade } = req.body;
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.grades.push({ course, semester, grade });
    await student.save();

    res.status(200).json({ message: 'Grade submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
