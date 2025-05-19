const express = require('express');
const router = express.Router();
const ScheduleRequest = require('../models/ScheduleRequest');

// ✅ POST: Submit schedule change request
router.post('/request', async (req, res) => {
  const { facultyName, classId, oldDate, newDate, reason } = req.body;
  if (!facultyName || !classId || !oldDate || !newDate || !reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const request = new ScheduleRequest({
      facultyName,
      classId,
      oldDate,
      newDate,
      reason,
      approved: false
    });
    await request.save();
    res.status(201).json({ message: 'Schedule change request submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ POST: Approve schedule change by ID
router.post('/approve/:id', async (req, res) => {
  try {
    const request = await ScheduleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.approved = true;
    await request.save();
    res.status(200).json({ message: 'Schedule change approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET: All schedule change requests (for HOD/Admin)
router.get('/all', async (req, res) => {
  try {
    const requests = await ScheduleRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET: Schedule change requests by faculty name
router.get('/faculty/:name', async (req, res) => {
  try {
    const requests = await ScheduleRequest.find({ facultyName: req.params.name });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
