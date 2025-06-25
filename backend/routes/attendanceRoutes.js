const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/fingerprint', attendanceController.storeFingerprint);
router.post('/mark', attendanceController.markAttendanceByFingerprint);
router.get('/course/:course', attendanceController.getAttendanceByCourse);
router.get('/student/:did', attendanceController.getAttendanceByDID);

module.exports = router;


/*
const express = require('express');
const crypto = require('crypto');
const Fingerprint = require('../models/Fingerprint');
const Attendance = require('../models/Attendance');

const router = express.Router();

// ✅ Store fingerprint hash for a DID
router.post('/fingerprint', async (req, res) => {
  const { did, fingerprintData } = req.body;

  if (!did || !fingerprintData) {
    return res.status(400).json({ message: 'DID and fingerprint data required' });
  }

  try {
    const fingerprintHash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

    const existing = await Fingerprint.findOne({ did });
    if (existing) {
      existing.fingerprintHash = fingerprintHash;
      await existing.save();
      return res.status(200).json({ message: 'Fingerprint updated successfully' });
    }

    await Fingerprint.create({ did, fingerprintHash });
    res.status(201).json({ message: 'Fingerprint stored successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error storing fingerprint', error: err.message });
  }
});

// ✅ Mark attendance using fingerprint hash
router.post('/mark', async (req, res) => {
  const { fingerprintData, course, semester } = req.body;

  if (!fingerprintData || !course || !semester) {
    return res.status(400).json({ message: 'Fingerprint, course, and semester are required' });
  }

  try {
    const fingerprintHash = crypto.createHash('sha256').update(fingerprintData).digest('hex');
    const matched = await Fingerprint.findOne({ fingerprintHash });

    if (!matched) {
      return res.status(404).json({ message: 'Fingerprint not recognized' });
    }

    const newRecord = new Attendance({
      did: matched.did,
      course,
      semester,
      status: 'present',
      verifiedByFingerprint: true,
      date: new Date()
    });

    await newRecord.save();
    res.status(200).json({ message: 'Attendance recorded', did: matched.did });
  } catch (err) {
    res.status(500).json({ message: 'Error marking attendance', error: err.message });
  }
});

// ✅ View all attendance by course (for faculty)
router.get('/course/:course', async (req, res) => {
  try {
    const records = await Attendance.find({ course: req.params.course });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving course attendance', error: err.message });
  }
});

// ✅ View all attendance by student DID
router.get('/student/:did', async (req, res) => {
  try {
    const records = await Attendance.find({ did: req.params.did });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving student attendance', error: err.message });
  }
});

module.exports = router;
*/