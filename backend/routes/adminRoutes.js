// ✅ File: routes/adminRoutes.js
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

module.exports = router;