// backend/routes/facultyRoutes.js

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students with their DID, courses, semester, and attendance
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}, 'did courses semester attendance');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// Assign grades to a student
router.post('/assign-grade', async (req, res) => {
  const { did, course, grade } = req.body;

  try {
    const student = await Student.findOne({ did });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existing = student.grades.find(g => g.course === course);
    if (existing) existing.grade = grade;
    else student.grades.push({ course, grade });

    await student.save();
    res.json({ message: 'Grade updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning grade', error: err.message });
  }
});

module.exports = router;
