const Fingerprint = require('../models/Fingerprint');
const Attendance = require('../models/Attendance');
const crypto = require('crypto');

// ✅ Store fingerprint hash for a student
exports.storeFingerprint = async (req, res) => {
  const { did, fingerprintData } = req.body;

  if (!did || !fingerprintData) {
    return res.status(400).json({ message: 'DID and fingerprint data are required' });
  }

  const fingerprintHash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

  try {
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
};

// ✅ Mark attendance using fingerprint match
exports.markAttendanceByFingerprint = async (req, res) => {
  const { fingerprintData, courseName, semester } = req.body;

  if (!fingerprintData || !courseName || semester === undefined) {
    return res.status(400).json({ message: 'Fingerprint, courseName, and semester are required' });
  }

  try {
    const fingerprintHash = crypto.createHash('sha256').update(fingerprintData).digest('hex');
    const matched = await Fingerprint.findOne({ fingerprintHash });

    if (!matched) {
      return res.status(404).json({ message: 'Fingerprint not recognized' });
    }

    const newRecord = new Attendance({
      did: matched.did,
      courseName,
      semester: parseInt(semester),
      status: 'present',
      verifiedByFingerprint: true,
      date: new Date()
    });

    await newRecord.save();
    res.status(200).json({ message: 'Attendance marked successfully', record: newRecord });
  } catch (err) {
    res.status(500).json({ message: 'Error marking attendance', error: err.message });
  }
};

// ✅ Get attendance records by course name
exports.getAttendanceByCourse = async (req, res) => {
  try {
    const records = await Attendance.find({ courseName: req.params.course });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving course attendance', error: err.message });
  }
};

// ✅ Get attendance records by student DID
exports.getAttendanceByDID = async (req, res) => {
  try {
    const records = await Attendance.find({ did: req.params.did });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving student attendance', error: err.message });
  }
};
