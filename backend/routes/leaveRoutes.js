// File: backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');

// ✅ POST: Submit a leave request
router.post('/request', async (req, res) => {
  const { did, reason, date } = req.body;

  if (!did || !reason || !date) {
    return res.status(400).json({ message: 'Missing required fields: did, reason, date' });
  }

  try {
    const leave = new Leave({ did, reason, date, approved: false });
    await leave.save();
    res.status(201).json({ message: 'Leave requested successfully', leave });
  } catch (err) {
    console.error('Error submitting leave:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ POST: Approve a leave request by ID
router.post('/approve/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.approved = true;
    await leave.save();

    res.status(200).json({ message: 'Leave approved successfully', leave });
  } catch (err) {
    console.error('Error approving leave:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET: All leaves (admin use)
router.get('/all', async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaves', error: err.message });
  }
});

// ✅ GET: Leaves for a specific student
router.get('/:did', async (req, res) => {
  try {
    const leaves = await Leave.find({ did: req.params.did }).sort({ date: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student leaves', error: err.message });
  }
});

module.exports = router;
