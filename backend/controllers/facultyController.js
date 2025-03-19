const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

// Get Student Information for Faculty
const getStudentInfo = async (req, res) => {
  try {
    const { studentDID } = req.params;

    const student = await Student.findOne({ did: studentDID });
    const attendanceRecords = await Attendance.find({ studentDID });
    const grades = await Grade.find({ studentDID });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.status(200).json({
      did: student.did,
      degree: student.degree,
      batch: student.batch,
      attendanceRecords,
      grades
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign Grade
const assignGrade = async (req, res) => {
  try {
    const { studentDID, course, semester, grade, recordedBy } = req.body;

    const newGrade = new Grade({ studentDID, course, semester, grade, recordedBy });
    await newGrade.save();

    res.status(201).json({ message: 'Grade assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudentInfo, assignGrade };
