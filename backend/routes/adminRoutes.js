// ✅ File: routes/adminRoutes.js
const Degree = require('../models/Degree');
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// This route can be expanded with real logic for issuing degrees, verifying signatures, etc.
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/admin/batch-stats
// @desc    Get student registration and degree issuance count per batch
router.get('/batch-stats', async (req, res) => {
  try {
    // Fetch all students with did and batch fields
    const students = await Student.find({}, 'did batch');
    
    // Initialize batchCounts object
    const batchCounts = {};

    // Count registered students per batch
    students.forEach(student => {
      const batch = student.batch || 'Unknown';
      if (!batchCounts[batch]) {
        batchCounts[batch] = { registered: 0, issued: 0 };
      }
      batchCounts[batch].registered += 1;
    });

    // Create a map from did to batch for quick lookup
    const studentMap = students.reduce((acc, s) => {
      acc[s.did] = s.batch || 'Unknown';
      return acc;
    }, {});

    // Fetch degrees with status 'Issued'
    const degrees = await Degree.find({ status: 'Issued' }, 'studentDID');

    // Count degrees issued per batch using studentMap
    degrees.forEach(deg => {
      const batch = studentMap[deg.studentDID] || 'Unknown';
      if (!batchCounts[batch]) {
        batchCounts[batch] = { registered: 0, issued: 0 };
      }
      batchCounts[batch].issued += 1;
    });

    res.json(batchCounts);

  } catch (err) {
    console.error('Error fetching batch stats:', err);
    res.status(500).json({ error: 'Failed to fetch batch statistics.' });
  }
});


module.exports = router;