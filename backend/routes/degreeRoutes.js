const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Degree = require('../models/Degree');
const { getDegree } = require('../controllers/degreeController');


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

// POST /api/degree/store-hash
router.post('/store-hash', async (req, res) => {
  const { studentDID, blockchainHash } = req.body;

  if (!studentDID || !blockchainHash) {
    return res.status(400).json({ message: 'studentDID and blockchainHash are required' });
  }

  try {
    // Update blockchainHash field directly (atomic update, no schema re-validation)
    const updatedDegree = await Degree.findOneAndUpdate(
      { studentDID },
      { blockchainHash },
      { new: true, runValidators: false } // Don't validate missing required fields
    );

    if (!updatedDegree) {
      return res.status(404).json({ message: 'Degree not found for this studentDID' });
    }

    res.status(200).json({ message: 'Blockchain hash stored successfully', blockchainHash });
  } catch (error) {
    console.error('Error storing blockchain hash:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

// ✅ 4. Public Degree Verification by DID or Hash


router.get('/verify', async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Input query parameter is required' });
  }

  try {
    const degree = await Degree.findOne({
      $or: [{ studentDID: input }, { blockchainHash: input }],
    });

    if (!degree) {
      return res.status(404).json({ error: 'Degree not found' });
    }

    // Fetch student data to get batch number (and any other info)
    const student = await Student.findOne({ did: degree.studentDID });

    res.json({
      name: degree.studentName || (student ? student.name : 'N/A'),
      studentDID: degree.studentDID,
      degree: degree.degree,
      cgpa: degree.cgpa || 'N/A',
      batch: student ? student.batch : 'Not Provided', // batch from student model
      issueDate: degree.issuedOn ? degree.issuedOn.toISOString().split('T')[0] : 'N/A',
      resultDate: degree.resultDeclarationDate ? degree.resultDeclarationDate.toISOString().split('T')[0] : 'N/A',
      ipfsHash: degree.ipfsHash || null,
      blockchainHash: degree.blockchainHash || null,
      pdfUrl: degree.pdfUrl || null,
      qrCodeUrl: degree.qrCodeUrl || null,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

router.post('/notification/read', async (req, res) => {
  const { studentDID } = req.body;
  try {
    const updatedDegree = await Degree.findOneAndUpdate(
      { studentDID, notification: true },
      { notification: false },
      { new: true }
    );

    if (!updatedDegree) {
      return res.status(404).json({ message: 'Notification already read or degree not found' });
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ✅ 3. Blockchain-issued Degree Info

// Get Degree by studentDID route (calls controller function)
router.get('/issued/:studentDID', getDegree);




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
