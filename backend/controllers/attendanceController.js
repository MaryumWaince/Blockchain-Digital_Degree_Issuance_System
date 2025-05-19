const Fingerprint = require('../models/Fingerprint');
const Attendance = require('../models/Attendance');
const crypto = require('crypto');

exports.storeFingerprint = async (req, res) => {
  const { did, fingerprintData } = req.body;
  if (!did || !fingerprintData) {
    return res.status(400).json({ message: 'DID and fingerprint are required' });
  }

  const fingerprintHash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

  try {
    const existing = await Fingerprint.findOne({ did });
    if (existing) {
      existing.fingerprintHash = fingerprintHash;
      await existing.save();
      return res.json({ message: 'Fingerprint updated' });
    }

    await Fingerprint.create({ did, fingerprintHash });
    res.status(201).json({ message: 'Fingerprint stored' });
  } catch (err) {
    res.status(500).json({ message: 'Error storing fingerprint', error: err.message });
  }
};

exports.markAttendanceByFingerprint = async (req, res) => {
  const { fingerprintData, course } = req.body;

  if (!fingerprintData || !course) {
    return res.status(400).json({ message: 'Fingerprint and course are required' });
  }

  const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

  try {
    const user = await Fingerprint.findOne({ fingerprintHash: hash });
    if (!user) return res.status(404).json({ message: 'Fingerprint not recognized' });

    const record = await Attendance.create({
      did: user.did,
      course,
      status: 'present',
      verifiedByFingerprint: true
    });

    res.status(200).json({ message: 'Attendance marked', record });
  } catch (err) {
    res.status(500).json({ message: 'Error marking attendance', error: err.message });
  }
};

exports.getAttendanceByCourse = async (req, res) => {
  const { course } = req.params;

  try {
    const records = await Attendance.find({ course });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving attendance', error: err.message });
  }
};

exports.getAttendanceByDID = async (req, res) => {
  const { did } = req.params;

  try {
    const records = await Attendance.find({ did });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving student attendance', error: err.message });
  }
};
