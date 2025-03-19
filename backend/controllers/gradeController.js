const Grade = require('../models/Grade');

// Record Grade
const recordGrade = async (req, res) => {
  try {
    const { studentDID, course, semester, grade, recordedBy } = req.body;

    const newGrade = new Grade({ studentDID, course, semester, grade, recordedBy });
    await newGrade.save();

    res.status(201).json({ message: 'Grade recorded successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch Grades by Student DID
const getGrades = async (req, res) => {
  try {
    const { studentDID } = req.params;

    const grades = await Grade.find({ studentDID });

    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordGrade, getGrades };

