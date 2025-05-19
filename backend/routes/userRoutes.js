// ✅ File: routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Faculty/Admin Registration
router.post('/register', async (req, res) => {
  const { name, cnic, userType } = req.body;
  if (!name || !cnic || !userType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const user = new User({ name, cnic, userType });
    await user.save();
    res.status(201).json({ message: `${userType} registered successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Faculty/Admin Login
router.post('/login', async (req, res) => {
  const { name, cnic, userType } = req.body;
  try {
    const user = await User.findOne({ name, cnic, userType });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.status(200).json({ message: 'Login successful', name: user.name, userType: user.userType });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

