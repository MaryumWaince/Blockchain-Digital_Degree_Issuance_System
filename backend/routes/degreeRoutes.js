const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Degree = require('../models/Degree');
const { getDegree, storeDegreeHashOnBlockchain } = require('../controllers/degreeController');

// ✅ 1. Academic Record Route
router.get('/academic/:studentDID', async (req, res) => {
  try {
    const studentDID = req.params.studentDID;
    const student = await Student.findOne({ did: studentDID });
    const grades = await Grade.find({ studentDID });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const enrichedGrades = await Promise.all(grades.map(async (g) => {
      const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
      return {
        ...g.toObject(),
        creditHours: course?.creditHours ?? 'N/A',
        totalMarks: course?.totalMarks ?? 'N/A'
      };
    }));

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

// ✅ 2. Add new degree with reused CGPA logic
router.post('/add', async (req, res) => {
  try {
    let {
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      blockchainHash,
      pdfUrl,
      pdfPath,
      resultDeclarationDate
    } = req.body;

    if (!cgpa || parseFloat(cgpa) === 0) {
      console.log('Calculating CGPA for:', studentDID);

      const grades = await Grade.find({ studentDID });

      if (!grades.length) {
        return res.status(400).json({ message: 'No grades found for CGPA calculation' });
      }

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
        if (!course) {
          console.warn(`Missing course for "${g.courseName}" in semester ${g.semester}`);
          return null;
        }
        return {
          creditHours: course.creditHours,
          qualityPoints: typeof g.qualityPoints === 'number' ? g.qualityPoints : 0
        };
      }));

      const validCourseData = courseData.filter(d => d !== null);

      const totalCH = validCourseData.reduce((sum, d) => sum + d.creditHours, 0);
      const totalQP = validCourseData.reduce((sum, d) => sum + d.qualityPoints, 0);

      console.log('Total Credit Hours:', totalCH);
      console.log('Total Quality Points:', totalQP);

      if (totalCH > 0) {
        cgpa = totalQP / totalCH;
        cgpa = parseFloat(cgpa.toFixed(2));
      } else {
        console.warn('No valid credit hours — setting CGPA to 0');
        cgpa = 0;
      }

      console.log("Final CGPA to store:", cgpa);
    }

    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      blockchainHash,
      status: 'Issued',
      issuedOn: new Date(),
      pdfGenerated: !!pdfUrl,
      pdfUrl,
      pdfPath,
      resultDeclarationDate: resultDeclarationDate || null
    });

    await newDegree.save();
    res.status(201).json({ message: 'Degree Issued Successfully', cgpa });

  } catch (error) {
    console.error('Error issuing degree:', error);
    res.status(400).json({ message: error.message });
  }
});


// ✅ 3. Blockchain-issued Degree Info

// Get Degree by studentDID route (calls controller function)
router.get('/issued/:studentDID', getDegree);

// Admin only route, protect with middleware if you have authentication
router.post('/store-hash', storeDegreeHashOnBlockchain);

module.exports = router;


/*
// routes/degree.js
const express = require('express');
const router = express.Router();
const { getDegreeByStudentDID, issueDegree } = require('../controllers/degreeController');
const Degree = require('../models/Degree');

router.get('/:studentDID', getDegreeByStudentDID);

router.post('/', async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degree, cgpa } = req.body;

    if (!studentDID || !studentName || !degree || !cgpa) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Degree.findOne({ studentDID });
    if (existing) return res.status(400).json({ message: 'Degree already exists' });

    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      status: 'Pending'
    });

    await newDegree.save();
    res.status(201).json({ message: 'Degree saved (Pending issuance)' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/issue', issueDegree);

module.exports = router;
*/





/*
const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Degree = require('../models/Degree');
const Signature = require('../models/Signature');

const { issueDegree, getDegreeByStudentDID } = require('../controllers/degreeController');

// ===============================
// 📄 GET Degree Info with Full Details
// GET /api/degrees/:studentDID
// ===============================
router.get('/:studentDID', async (req, res) => {
  try {
    const studentDID = req.params.studentDID;

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const grades = await Grade.find({ studentDID });
    const degree = await Degree.findOne({ studentDID });
    const vcSignature = await Signature.findOne({ role: 'VC' });

    const enrichedGrades = await Promise.all(
      grades.map(async (g) => {
        const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
        return {
          ...g.toObject(),
          creditHours: course?.creditHours ?? 0,
          totalMarks: course?.totalMarks ?? 0
        };
      })
    );

    const semesterMap = {};
    enrichedGrades.forEach((g) => {
      if (!semesterMap[g.semester]) semesterMap[g.semester] = [];
      semesterMap[g.semester].push(g);
    });

    const semesters = Object.entries(semesterMap).map(([semester, grades]) => {
      const totalCH = grades.reduce((sum, g) => sum + (typeof g.creditHours === 'number' ? g.creditHours : 0), 0);
      const totalQP = grades.reduce((sum, g) => sum + (g.qualityPoints || 0), 0);
      const gpa = totalCH ? (totalQP / totalCH).toFixed(2) : '0.00';

      return {
        semester: Number(semester),
        gpa,
        courses: grades.map((g) => ({
          courseName: g.courseName || g.course || 'N/A',
          creditHours: g.creditHours ?? 'N/A',
          totalMarks: g.totalMarks ?? 'N/A',
          obtainedMarks: g.obtainedMarks ?? 'N/A',
          grade: g.grade ?? 'N/A',
          qualityPoints: g.qualityPoints ?? 'N/A'
        }))
      };
    });

    const validGPAs = semesters.map((s) => parseFloat(s.gpa)).filter((v) => !isNaN(v));
    const cgpa = validGPAs.length
      ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2)
      : '0.00';

    res.status(200).json({
      student: {
        name: student.name,
        email: student.email || 'N/A',
        fatherName: student.fatherName || 'Not Provided',
        did: student.did,
        degree: student.degree || 'Not Provided',
        batch: student.batch || 'Not Provided'
      },
      semesters,
      cgpa,
      resultDate: degree?.resultDeclarationDate ?? null,
      issueDate: degree?.issuedOn ? degree.issuedOn.toISOString().split('T')[0] : null,
      vcSignatureUrl: vcSignature
        ? `${req.protocol}://${req.get('host')}/${vcSignature.imagePath}`
        : null,
      blockchainHash: degree?.blockchainHash || null
    });
  } catch (err) {
    console.error('Degree fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===============================
// 💾 Save Degree (Initial)
// POST /api/degrees
// ===============================
router.post('/', async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degree, cgpa } = req.body;

    if (!studentDID || !studentName || !degree || !cgpa) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Degree.findOne({ studentDID });
    if (existing) return res.status(400).json({ message: 'Degree already exists' });

    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      status: 'Pending',
    });

    await newDegree.save();
    res.status(201).json({ message: 'Degree saved (Pending issuance)' });
  } catch (err) {
    console.error('Degree creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===============================
// 🖨️ Generate Degree PDF
// POST /api/degrees/generateDegreePDF/:studentDID
// ===============================
// POST /api/degrees/issue
router.post('/issue', issueDegree);

// GET /api/degrees/:studentDID
router.get('/:studentDID', getDegreeByStudentDID);

module.exports = router;
*/







/*
const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Degree = require('../models/Degree');
const Signature = require('../models/Signature');

const { issueDegree, getDegree, generateDegreePDF } = require('../controllers/degreeController');

// GET Degree Info with full details
router.get('/:studentDID', async (req, res) => {
  try {
    const studentDID = req.params.studentDID;

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const grades = await Grade.find({ studentDID });
    const degree = await Degree.findOne({ studentDID });
    const vcSignature = await Signature.findOne({ role: 'VC' });

    // Enrich grades
    const enrichedGrades = await Promise.all(
      grades.map(async (g) => {
        const course = await Course.findOne({ courseName: g.courseName, semester: g.semester });
        return {
          ...g.toObject(),
          creditHours: course?.creditHours ?? 0,
          totalMarks: course?.totalMarks ?? 0
        };
      })
    );

    // Group grades by semester
    const semesterMap = {};
    enrichedGrades.forEach((g) => {
      if (!semesterMap[g.semester]) semesterMap[g.semester] = [];
      semesterMap[g.semester].push(g);
    });

    // GPA + CGPA
    const semesters = Object.entries(semesterMap).map(([semester, grades]) => {
      const totalCH = grades.reduce((sum, g) => sum + (typeof g.creditHours === 'number' ? g.creditHours : 0), 0);
      const totalQP = grades.reduce((sum, g) => sum + (g.qualityPoints || 0), 0);
      const gpa = totalCH ? (totalQP / totalCH).toFixed(2) : '0.00';

      return {
        semester: Number(semester),
        gpa,
        courses: grades.map((g) => ({
          courseName: g.courseName || g.course || 'N/A',
          creditHours: g.creditHours ?? 'N/A',
          totalMarks: g.totalMarks ?? 'N/A',
          obtainedMarks: g.obtainedMarks ?? 'N/A',
          grade: g.grade ?? 'N/A',
          qualityPoints: g.qualityPoints ?? 'N/A'
        }))
      };
    });

    const validGPAs = semesters.map((s) => parseFloat(s.gpa)).filter((v) => !isNaN(v));
    const cgpa = validGPAs.length
      ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2)
      : '0.00';

    res.status(200).json({
      student: {
        name: student.name,
        email: student.email || 'N/A',
        fatherName: student.fatherName || 'Not Provided',
        did: student.did,
        degree: student.degree || 'Not Provided',
        batch: student.batch || 'Not Provided'
      },
      semesters,
      cgpa,
      resultDate: degree?.resultDeclarationDate ?? null,
      issueDate: degree?.issuedOn ? degree.issuedOn.toISOString().split('T')[0] : null,
      vcSignatureUrl: vcSignature
        ? `${req.protocol}://${req.get('host')}/${vcSignature.imagePath}`
        : null,
      blockchainHash: degree?.blockchainHash || null
    });
  } catch (err) {
    console.error('Degree fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST Save degree with initial info
router.post('/', async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degree, cgpa } = req.body;

    if (!studentDID || !studentName || !degree || !cgpa) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Degree.findOne({ studentDID });
    if (existing) return res.status(400).json({ message: 'Degree already exists' });

    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      status: 'Pending',
    });

    await newDegree.save();
    res.status(201).json({ message: 'Degree saved (Pending issuance)' });
  } catch (err) {
    console.error('Degree creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST Generate Degree PDF
router.post('/generateDegreePDF/:studentDID', generateDegreePDF);

// POST Issue Degree (Full flow: CGPA check, PDF, IPFS, Blockchain)
router.post('/issue', issueDegree);

module.exports = router;

*/
