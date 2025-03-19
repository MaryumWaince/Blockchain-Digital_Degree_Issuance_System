const Attendance = require('../models/Attendance');

// Record Attendance
const recordAttendance = async (req, res) => {
  try {
    const { studentDID, status, fingerprintHash } = req.body;

    const attendance = new Attendance({ studentDID, status, fingerprintHash });
    await attendance.save();

    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch Attendance by Student DID
const getAttendance = async (req, res) => {
  try {
    const { studentDID } = req.params;

    const attendanceRecords = await Attendance.find({ studentDID });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordAttendance, getAttendance };

