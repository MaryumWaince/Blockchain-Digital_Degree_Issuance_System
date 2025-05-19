const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course'); // ✅ Required for enrichment

router.get('/:studentDID', async (req, res) => {
  try {
    const studentDID = req.params.studentDID;

    const student = await Student.findOne({ did: studentDID });
    const grades = await Grade.find({ studentDID });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // ✅ Enrich each grade with course info
    const enrichedGrades = await Promise.all(grades.map(async (g) => {
      const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
      return {
        ...g.toObject(),
        creditHours: course?.creditHours ?? 'N/A',
        totalMarks: course?.totalMarks ?? 'N/A'
      };
    }));

    // ✅ Group by semester
    const semesterMap = {};
    enrichedGrades.forEach(g => {
      if (!semesterMap[g.semester]) semesterMap[g.semester] = [];
      semesterMap[g.semester].push(g);
    });

    const semesters = Object.entries(semesterMap).map(([semester, grades]) => {
      const totalCH = grades.reduce((sum, g) => sum + (g.creditHours !== 'N/A' ? g.creditHours : 0), 0);
      const totalQP = grades.reduce((sum, g) => sum + (g.qualityPoints || 0), 0);
      const gpa = totalCH ? (totalQP / totalCH).toFixed(2) : '0.00';

      return {
        semester: Number(semester),
        gpa,
        courses: grades.map(g => ({
          courseName: g.courseName || g.course || 'N/A',
          creditHours: g.creditHours ?? 'N/A',
          totalMarks: g.totalMarks ?? 'N/A',
          obtainedMarks: g.obtainedMarks ?? 'N/A',
          grade: g.grade ?? 'N/A',
          qualityPoints: g.qualityPoints ?? 'N/A'
        }))
      };
    });

    const validGPAs = semesters.map(s => parseFloat(s.gpa)).filter(v => !isNaN(v));
    const cgpa = validGPAs.length ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2) : '0.00';

    res.status(200).json({
      student: {
        name: student.name,
        fatherName: student.fatherName || 'Not Provided',
        did: student.did,
        degree: student.degree || 'Not Provided',
        batch: student.batch || 'Not Provided'
      },
      semesters,
      cgpa,
      resultDate: student.resultDeclarationDate || null,
      issueDate: new Date().toISOString().split('T')[0]
    });

  } catch (err) {
    console.error('Degree fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Grade = require('../models/Grade');

// GET /api/degrees/:studentDID
router.get('/:studentDID', async (req, res) => {
  try {
    const studentDID = req.params.studentDID;

    const student = await Student.findOne({ did: studentDID });
    const grades = await Grade.find({ studentDID });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Organize grades per semester
    const semesterMap = {};
    grades.forEach(g => {
      if (!semesterMap[g.semester]) semesterMap[g.semester] = [];
      semesterMap[g.semester].push(g);
    });

    const semesters = Object.entries(semesterMap).map(([semester, grades]) => {
      const totalCH = grades.reduce((sum, g) => sum + (g.creditHours || 0), 0);
      const totalQP = grades.reduce((sum, g) => sum + (g.qualityPoints || 0), 0);
      const gpa = totalCH > 0 ? (totalQP / totalCH).toFixed(2) : 'N/A';

      return {
        semester: Number(semester),
        gpa,
        courses: grades.map(g => ({
          courseName: g.courseName || g.course || 'N/A',
          creditHours: g.creditHours || 'N/A',
          totalMarks: g.totalMarks || 'N/A',
          obtainedMarks: g.obtainedMarks || g.marks || 'N/A',
          grade: g.grade || 'N/A',
          qualityPoints: g.qualityPoints || 'N/A'
        }))
      };
    });

    const validGpas = semesters
      .map(s => parseFloat(s.gpa))
      .filter(g => !isNaN(g));

    const cgpa =
      validGpas.length > 0
        ? (validGpas.reduce((sum, g) => sum + g, 0) / validGpas.length).toFixed(2)
        : 'N/A';

    res.json({
      student: {
        name: student.name,
        fatherName: student.fatherName || 'Not Provided',
        did: student.did,
        degree: student.degree || 'Not Provided',
        batch: student.batch || 'Not Provided'
      },
      semesters,
      cgpa,
      resultDate: student.resultDeclarationDate || null,
      issueDate: new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Degree fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
*/