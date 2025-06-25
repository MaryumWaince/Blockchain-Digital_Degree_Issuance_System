const Degree = require('../models/Degree');

// Get degree by studentDID
const getDegree = async (req, res) => {
  try {
    const { studentDID } = req.params;
    const degree = await Degree.findOne({ studentDID });

    if (!degree) {
      return res.status(404).json({ message: 'Degree not found' });
    }

    res.status(200).json(degree);
  } catch (error) {
    console.error('Error fetching degree:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDegree };


/*
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Degree = require('../models/Degree');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Signature = require('../models/Signature');
const Student = require('../models/Student');
const uploadPDFToIPFS = require('../blockchain/utils/ipfsUpload');
const { contract, web3 } = require('../blockchain/utils/web3');

const ADMIN_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.SEPOLIA_ADMIN_ADDRESS;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// ===========================
// 🎓 Issue Degree Controller
// ===========================
const issueDegree = async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degree, cgpa } = req.body;

    if (!studentDID || !studentName || !degree || !cgpa) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const grades = await Grade.find({ studentDID }) || [];
    const semestersCompleted = new Set(grades.map(g => Number(g.semester)));
    const totalSemesters = 8;
    const allSemestersCompleted = semestersCompleted.size === totalSemesters;

    const groupedBySemester = grades.reduce((acc, record) => {
      const sem = Number(record.semester);
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(record);
      return acc;
    }, {});

    const hasNoFGrade = Object.values(groupedBySemester).every(semesterCourses =>
      semesterCourses.every(course => (course.grade || '').toUpperCase() !== 'F')
    );

    if (!allSemestersCompleted || !hasNoFGrade) {
      return res.status(400).json({
        message: 'Student has not completed all semesters or has F grade(s)',
        totalGradesFound: grades.length,
        semestersCompleted: Array.from(semestersCompleted),
        allSemestersCompleted,
        hasNoFGrade,
      });
    }

    // ✅ Enrich grades with course data
    for (const grade of grades) {
      const course = await Course.findOne({ courseName: grade.courseName });
      grade.creditHours = course?.creditHours || 0;
      grade.totalMarks = course?.totalMarks || 0;
    }

    const resultDeclarationDate = new Date();

    const pdfFilePath = await generateDegreePDFHelper({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      resultDeclarationDate,
      grades,
    });

    const cid = await uploadPDFToIPFS(pdfFilePath);
    fs.unlinkSync(pdfFilePath);

    const issueDate = resultDeclarationDate.toISOString().split('T')[0];
    const data = contract.methods.issueDegree(studentDID, cid, issueDate).encodeABI();

    const nonce = await web3.eth.getTransactionCount(ADMIN_ADDRESS, 'pending');
    const tx = {
      to: contract.options.address,
      data,
      gas: 3000000,
      nonce,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, ADMIN_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      blockchainHash: receipt.transactionHash,
      resultDeclarationDate,
      issuedOn: new Date(),
      status: 'Issued',
      pdfPath: cid,
      pdfGenerated: true,
      pdfUrl: `${IPFS_GATEWAY}/${cid}`,
    });

    await newDegree.save();

    return res.status(201).json({
      message: 'Degree Issued Successfully',
      ipfsUrl: `${IPFS_GATEWAY}/${cid}`,
      ipfsCid: cid,
      blockchainHash: receipt.transactionHash,
    });

  } catch (error) {
    console.error('❌ Error in issueDegree:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ===========================
// 📄 Internal PDF Generator Helper
// ===========================
const generateDegreePDFHelper = async ({
  studentDID,
  studentName,
  studentEmail,
  degree,
  cgpa,
  resultDeclarationDate,
  grades,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const folder = path.join(__dirname, '..', 'degree_pdfs');
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      const fileName = `${studentDID}.pdf`;
      const fullPath = path.join(folder, fileName);
      const doc = new PDFDocument({ margin: 50 });

      const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSans-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        doc.registerFont('NotoSans', fontPath);
        doc.font('NotoSans');
      }

      const stream = fs.createWriteStream(fullPath);
      doc.pipe(stream);

      doc.fontSize(25).text('🎓 Degree Certificate', { align: 'center' }).moveDown(1.5);
      doc.fontSize(16).text(`Student: ${studentName || 'N/A'}`);
      doc.text(`DID: ${studentDID || 'N/A'}`);
      doc.text(`Email: ${studentEmail || 'N/A'}`);
      doc.text(`Degree: ${degree || 'N/A'}`);

      const formattedCGPA =
        typeof cgpa === 'number' ? cgpa.toFixed(2) :
        typeof cgpa === 'string' && !isNaN(parseFloat(cgpa)) ? parseFloat(cgpa).toFixed(2) :
        'N/A';
      doc.text(`CGPA: ${formattedCGPA}`);

      const declarationDateText = resultDeclarationDate instanceof Date
        ? resultDeclarationDate.toDateString()
        : resultDeclarationDate
          ? new Date(resultDeclarationDate).toDateString()
          : 'Not Declared';
      doc.text(`Declared On: ${declarationDateText}`);

      doc.moveDown(1).fontSize(14).text('Semester-wise Grades:', { underline: true });

      grades.sort((a, b) => Number(a.semester) - Number(b.semester));
      const groupedGrades = grades.reduce((acc, record) => {
        const sem = Number(record.semester);
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(record);
        return acc;
      }, {});

      for (const sem of Object.keys(groupedGrades).sort((a, b) => a - b)) {
        doc.moveDown(0.5).text(`Semester ${sem}:`, { underline: true });
        groupedGrades[sem].forEach(course => {
          const creditHoursText = course.creditHours ? ` (${course.creditHours} CH)` : '';
          const totalMarksText = course.totalMarks ? ` / ${course.totalMarks}` : '';
          doc.text(`- ${course.courseName}${creditHoursText}: ${course.obtainedMarks}${totalMarksText}, Grade: ${course.grade}`);
        });
      }

      const vcSignature = await Signature.findOne({ role: 'VC' });
      if (vcSignature?.imagePath) {
        const signaturePath = path.resolve(__dirname, '..', vcSignature.imagePath);
        if (fs.existsSync(signaturePath)) {
          doc.addPage();
          doc.text('VC Signature:', { align: 'left' }).moveDown(0.5);
          doc.image(signaturePath, { fit: [200, 100], align: 'left' });
          doc.moveDown(0.5).text('Verified by Vice Chancellor', { align: 'left' });
        } else {
          console.warn('⚠️ VC signature image not found at:', signaturePath);
        }
      }

      doc.end();

      stream.on('finish', () => resolve(fullPath));
      stream.on('error', err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

// ===========================
// 🔍 Get Degree by Student DID (With Grades)
// ===========================
const getDegreeByStudentDID = async (req, res) => {
  try {
    const { studentDID } = req.params;
    if (!studentDID) {
      return res.status(400).json({ message: 'studentDID is required' });
    }

    const degree = await Degree.findOne({ studentDID });
    if (!degree) {
      return res.status(404).json({ message: 'Degree not found for this studentDID' });
    }

    const student = await Student.findOne({ did: studentDID });
    const grades = await Grade.find({ studentDID });

    // Enrich grades
    for (const grade of grades) {
      const course = await Course.findOne({ courseName: grade.courseName });
      grade.creditHours = course?.creditHours || 0;
      grade.totalMarks = course?.totalMarks || 0;
    }

    return res.status(200).json({
      degree,
      student: student || null,
      grades,
    });
  } catch (error) {
    console.error('❌ Error in getDegreeByStudentDID:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  issueDegree,
  getDegreeByStudentDID,
};
*/




/*
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Degree = require('../models/Degree');
const Grade = require('../models/Grade');
const Signature = require('../models/Signature');
const Student = require('../models/Student');
const uploadPDFToIPFS = require('../blockchain/utils/ipfsUpload');
const { contract, web3 } = require('../blockchain/utils/web3');

const ADMIN_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.SEPOLIA_ADMIN_ADDRESS;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs'; // Replace with any IPFS gateway you prefer

// ===========================
// 🎓 Issue Degree Controller
// ===========================
const issueDegree = async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degree, cgpa } = req.body;

    // Fetch all grades for the student
    const grades = await Grade.find({ studentDID }) || [];

    // Determine completed semesters (as integers)
    const semestersCompleted = new Set(grades.map(g => Number(g.semester)));

    // Assuming 8 semesters total for degree completion
    const allSemestersCompleted = semestersCompleted.size === 8;

    // Group grades by semester
    const groupedBySemester = grades.reduce((acc, record) => {
      const sem = Number(record.semester);
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(record);
      return acc;
    }, {});

    // Check for no 'F' grade in any course
    const hasNoFGrade = Object.values(groupedBySemester).every(courseArray =>
      courseArray.every(course => {
        const grade = (course.grade || '').toString().trim().toUpperCase();
        return grade !== 'F';
      })
    );

    if (!allSemestersCompleted || !hasNoFGrade) {
      return res.status(400).json({
        message: 'Student has not completed all semesters or has F grade(s)',
        totalGradesFound: grades.length,
        semestersCompleted: Array.from(semestersCompleted),
        allSemestersCompleted,
        hasNoFGrade,
      });
    }

    const resultDeclarationDate = new Date();

    // Generate Degree PDF locally
    const pdfPath = await generateDegreePDFHelper({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      resultDeclarationDate,
      grades,
    });

    // Upload PDF to IPFS, get CID
    const cid = await uploadPDFToIPFS(pdfPath);
    console.log(`✅ IPFS CID: ${cid}`);

    const issueDate = resultDeclarationDate.toISOString().split('T')[0];
    const data = contract.methods.issueDegree(studentDID, cid, issueDate).encodeABI();

    // Prepare transaction
    const tx = {
      to: contract.options.address,
      data,
      gas: 3000000,
      nonce: await web3.eth.getTransactionCount(ADMIN_ADDRESS),
    };

    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, ADMIN_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('🎉 Degree Issued on Blockchain:', receipt.transactionHash);

    // Save degree document in MongoDB
    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degree,
      cgpa,
      blockchainHash: receipt.transactionHash,
      resultDeclarationDate,
      issuedOn: new Date(),
      status: 'Issued',
      pdfPath: cid,           // IPFS CID
      pdfGenerated: true,
      pdfUrl: `${IPFS_GATEWAY}/${cid}`,
    });

    await newDegree.save();

    return res.status(201).json({
      message: 'Degree Issued Successfully',
      ipfsUrl: `${IPFS_GATEWAY}/${cid}`,
      pdfPath: cid,
      blockchainHash: receipt.transactionHash,
    });

  } catch (error) {
    console.error('❌ Error in issueDegree:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ===========================
// 📄 Internal PDF Generator Helper
// ===========================
const generateDegreePDFHelper = async ({
  studentDID,
  studentName,
  studentEmail,
  degree,
  cgpa,
  resultDeclarationDate,
  grades,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const folder = path.join(__dirname, '..', 'degree_pdfs');
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      const fileName = `${studentDID}.pdf`;
      const fullPath = path.join(folder, fileName);
      const doc = new PDFDocument({ margin: 50 });

      // Register font
      const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSans-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        doc.registerFont('NotoSans', fontPath);
        doc.font('NotoSans');
      }

      const stream = fs.createWriteStream(fullPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(25).text('🎓 Degree Certificate', { align: 'center' }).moveDown(1.5);

      // Student Info
      doc.fontSize(16).text(`Student: ${studentName || 'N/A'}`);
      doc.text(`DID: ${studentDID || 'N/A'}`);
      doc.text(`Email: ${studentEmail || 'N/A'}`);
      doc.text(`Degree: ${degree || 'N/A'}`);

      const formattedCGPA =
        typeof cgpa === 'number' ? cgpa.toFixed(2) :
        typeof cgpa === 'string' && !isNaN(parseFloat(cgpa)) ? parseFloat(cgpa).toFixed(2) :
        'N/A';

      doc.text(`CGPA: ${formattedCGPA}`);

      const declarationDateText = resultDeclarationDate instanceof Date
        ? resultDeclarationDate.toDateString()
        : resultDeclarationDate
          ? new Date(resultDeclarationDate).toDateString()
          : 'Not Declared';
      doc.text(`Declared On: ${declarationDateText}`);

      doc.moveDown(1).fontSize(14).text('Semester-wise Grades:', { underline: true });

      // Sort grades
      grades.sort((a, b) => Number(a.semester) - Number(b.semester));

      // Group by semester
      const groupedGrades = grades.reduce((acc, record) => {
        const sem = Number(record.semester);
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(record);
        return acc;
      }, {});

      for (const sem of Object.keys(groupedGrades).sort((a, b) => a - b)) {
        doc.moveDown(0.5).text(`Semester ${sem}:`, { underline: true });
        groupedGrades[sem].forEach(course => {
          const creditHoursText = course.creditHours ? ` (${course.creditHours} CH)` : '';
          doc.text(`- ${course.courseName}${creditHoursText}: ${course.grade}`);
        });
      }

      // VC Signature (if exists)
      const vcSignature = await Signature.findOne({ role: 'VC' });
      if (vcSignature?.imagePath) {
        const signaturePath = path.resolve(__dirname, '..', vcSignature.imagePath);
        if (fs.existsSync(signaturePath)) {
          doc.addPage();
          doc.text('VC Signature:', { align: 'left' }).moveDown(0.5);
          doc.image(signaturePath, { fit: [200, 100], align: 'left' });
          doc.moveDown(0.5).text('Verified by Vice Chancellor', { align: 'left' });
        } else {
          console.warn('⚠️ VC signature image not found at:', signaturePath);
        }
      }

      doc.end();

      stream.on('finish', () => resolve(fullPath));
      stream.on('error', err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

// ===========================
// 🔍 Get Degree by Student DID
// ===========================
const getDegree = async (req, res) => {
  try {
    const { studentDID } = req.params;

    const degree = await Degree.findOne({ studentDID }).lean();

    if (!degree) return res.status(404).json({ message: 'Degree not found' });

    const vcSignature = await Signature.findOne({ role: 'VC' });

    return res.status(200).json({
      ...degree,
      vcSignatureUrl: vcSignature
        ? `${req.protocol}://${req.get('host')}/${vcSignature.imagePath}`
        : null,
    });

  } catch (error) {
    console.error('❌ getDegree error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ===========================
// ♻️ Manually Regenerate PDF
// ===========================
const generateDegreePDF = async (req, res) => {
  try {
    const { studentDID } = req.params;

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const degree = await Degree.findOne({ studentDID });
    if (!degree) return res.status(404).json({ message: 'Degree record not found' });

    const grades = await Grade.find({ studentDID });

    const pdfPath = await generateDegreePDFHelper({
      studentDID,
      studentName: student.name,
      studentEmail: student.email,
      degree: degree.degree,
      cgpa: degree.cgpa,
      resultDeclarationDate: degree.resultDeclarationDate,
      grades,
    });

    return res.status(200).json({ message: 'PDF generated', pdfPath });

  } catch (error) {
    console.error('❌ generateDegreePDF error:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  issueDegree,
  getDegree,
  generateDegreePDF,
};

*/