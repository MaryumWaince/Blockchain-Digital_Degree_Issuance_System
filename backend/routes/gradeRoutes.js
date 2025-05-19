const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const Course = require('../models/Course');

// 🔢 Utility: Grade & Quality Point Calculation
const calculateGradeDetails = (obtainedMarks, totalMarks, creditHours) => {
  const percentage = (obtainedMarks / totalMarks) * 100;
  let grade = 'F';
  let gradePoint = 0;

  if (percentage >= 80) { grade = 'A'; gradePoint = 4.0; }
  else if (percentage >= 70) { grade = 'B'; gradePoint = 3.0; }
  else if (percentage >= 60) { grade = 'C'; gradePoint = 2.0; }
  else if (percentage >= 50) { grade = 'D'; gradePoint = 1.0; }

  const qualityPoints = gradePoint * creditHours;
  return { grade, qualityPoints };
};

// ✅ Submit or update grade
router.post('/submit', async (req, res) => {
  try {
    const { studentDID, courseName, semester, obtainedMarks } = req.body;
    if (!studentDID || !courseName || semester == null || obtainedMarks == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const course = await Course.findOne({ courseName, semester });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { creditHours, totalMarks } = course;
    const { grade, qualityPoints } = calculateGradeDetails(obtainedMarks, totalMarks, creditHours);

    let existing = await Grade.findOne({ studentDID, courseName, semester });

    if (existing) {
      existing.obtainedMarks = obtainedMarks;
      existing.grade = grade;
      existing.qualityPoints = qualityPoints;
      existing.creditHours = creditHours;
      existing.totalMarks = totalMarks;
      await existing.save();
      return res.status(200).json({ message: 'Grade updated', data: existing });
    }

    const newGrade = new Grade({
      studentDID,
      courseName,
      semester,
      obtainedMarks,
      grade,
      qualityPoints,
      creditHours,
      totalMarks
    });

    await newGrade.save();
    res.status(201).json({ message: 'Grade submitted', data: newGrade });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get all grades (enriched with course info)
router.get('/:studentDID', async (req, res) => {
  try {
    const grades = await Grade.find({ studentDID: req.params.studentDID });
    res.status(200).json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message });
  }
});

// ✅ Accurate GPA & CGPA
router.get('/gpa/:studentDID', async (req, res) => {
  try {
    const grades = await Grade.find({ studentDID: req.params.studentDID });

    const semesterMap = {};
    grades.forEach(g => {
      if (!semesterMap[g.semester]) semesterMap[g.semester] = { totalCH: 0, totalQP: 0 };
      semesterMap[g.semester].totalCH += g.creditHours || 0;
      semesterMap[g.semester].totalQP += g.qualityPoints || 0;
    });

    const semesters = Object.entries(semesterMap).map(([semester, data]) => {
      const gpa = data.totalCH ? (data.totalQP / data.totalCH).toFixed(2) : '0.00';
      return { semester: Number(semester), gpa };
    });

    const totalGPA = semesters.reduce((sum, s) => sum + parseFloat(s.gpa), 0);
    const cgpa = semesters.length ? (totalGPA / semesters.length).toFixed(2) : '0.00';

    res.status(200).json({ semesters, cgpa });

  } catch (err) {
    res.status(500).json({ message: 'Error calculating GPA/CGPA', error: err.message });
  }
});

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const Course = require('../models/Course');

// Utility to calculate grade and quality points
const calculateGradeDetails = (obtainedMarks, totalMarks, creditHours) => {
  const percentage = (obtainedMarks / totalMarks) * 100;
  let grade = 'F';
  let gradePoint = 0;

  if (percentage >= 80) { grade = 'A'; gradePoint = 4.0; }
  else if (percentage >= 70) { grade = 'B'; gradePoint = 3.0; }
  else if (percentage >= 60) { grade = 'C'; gradePoint = 2.0; }
  else if (percentage >= 50) { grade = 'D'; gradePoint = 1.0; }

  const qualityPoints = gradePoint * creditHours;
  return { grade, qualityPoints };
};

// POST: Submit or update a grade
router.post('/submit', async (req, res) => {
  try {
    const { studentDID, courseName, semester, obtainedMarks } = req.body;

    if (!studentDID || !courseName || semester == null || obtainedMarks == null) {
      return res.status(400).json({
        message: 'Missing required fields: studentDID, courseName, semester, obtainedMarks'
      });
    }

    const courseData = await Course.findOne({ courseName, semester });
    if (!courseData) {
      return res.status(404).json({ message: 'Course not found for the given semester' });
    }

    const { creditHours, totalMarks } = courseData;
    const { grade, qualityPoints } = calculateGradeDetails(obtainedMarks, totalMarks, creditHours);

    let existing = await Grade.findOne({ studentDID, courseName, semester });

    if (existing) {
      existing.obtainedMarks = obtainedMarks;
      existing.grade = grade;
      existing.qualityPoints = qualityPoints;
      await existing.save();
      return res.status(200).json({ message: 'Grade updated successfully', data: existing });
    }

    const newGrade = new Grade({
      studentDID,
      courseName,
      semester,
      obtainedMarks,
      grade,
      qualityPoints
    });

    await newGrade.save();
    res.status(201).json({ message: 'Grade submitted successfully', data: newGrade });

  } catch (err) {
    res.status(500).json({ message: 'Server error during grade submission', error: err.message });
  }
});

// GET: Retrieve grades by studentDID enriched with creditHours and totalMarks
router.get('/:studentDID', async (req, res) => {
  try {
    const grades = await Grade.find({ studentDID: req.params.studentDID });

    const enrichedGrades = await Promise.all(grades.map(async (g) => {
      const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
      return {
        _id: g._id,
        studentDID: g.studentDID,
        courseName: g.courseName,
        semester: g.semester,
        obtainedMarks: g.obtainedMarks,
        grade: g.grade,
        qualityPoints: g.qualityPoints,
        creditHours: course?.creditHours || 0,
        totalMarks: course?.totalMarks || 0,
      };
    }));

    res.status(200).json(enrichedGrades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message });
  }
});

// GET: GPA and CGPA calculation
router.get('/gpa/:studentDID', async (req, res) => {
  try {
    const { studentDID } = req.params;
    const grades = await Grade.find({ studentDID });

    // Group grades by semester
    const semesterMap = {};
    grades.forEach(g => {
      if (!semesterMap[g.semester]) {
        semesterMap[g.semester] = { totalQP: 0, totalCH: 0 };
      }
      semesterMap[g.semester].totalQP += g.qualityPoints || 0;
      semesterMap[g.semester].totalCH += g.creditHours || 0;
    });

    // Calculate GPA per semester
    const semesters = Object.entries(semesterMap).map(([semester, data]) => {
      const gpa = data.totalCH === 0 ? 0 : data.totalQP / data.totalCH;
      return {
        semester: Number(semester),
        gpa: gpa.toFixed(2)
      };
    });

    // Calculate CGPA as average of GPAs
    const totalGPA = semesters.reduce((sum, sem) => sum + parseFloat(sem.gpa), 0);
    const cgpa = semesters.length === 0 ? '0.00' : (totalGPA / semesters.length).toFixed(2);

    res.status(200).json({ semesters, cgpa });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating GPA/CGPA', error: err.message });
  }
});

module.exports = router;
*/