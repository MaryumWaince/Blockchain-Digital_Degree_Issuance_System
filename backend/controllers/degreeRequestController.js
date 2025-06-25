// degreeRequestController.js

const fs = require('fs');
const path = require('path');
const DegreeRequest = require('../models/DegreeRequest');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Degree = require('../models/Degree');
const { uploadToIPFS } = require('../blockchain/utils/ipfsUpload');
const { issueDegree, getDegreeHash } = require('../blockchain/contractFunctions');
const { saveIPFSHashToMongo, saveBlockchainHashToMongo } = require('../blockchain/utils/saveIpfsHash');
const generateDegreePDF = require('../utils/generateDegreePDF');

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

exports.submitDegreeRequest = async (req, res) => {
  const { studentDID } = req.body;

  if (!studentDID) return res.status(400).json({ message: 'studentDID is required' });

  try {
    const exists = await DegreeRequest.findOne({ studentDID });
    if (exists) return res.status(400).json({ message: 'Request already exists' });

    const newRequest = new DegreeRequest({
      studentDID,
      status: 'Pending',
      remark: '',
      createdAt: new Date(),
    });
    await newRequest.save();
    res.status(201).json({ message: 'Request submitted', data: newRequest });
  } catch (err) {
    console.error('❌ Submit Request Error:', err);
    res.status(500).json({ error: 'Failed to submit request', details: err.message });
  }
};

exports.getAllDegreeRequests = async (req, res) => {
  try {
    const requests = await DegreeRequest.find().sort({ createdAt: -1 });
    res.json({ message: 'Requests fetched', data: requests });
  } catch (err) {
    console.error('❌ Fetch Requests Error:', err);
    res.status(500).json({ error: 'Failed to fetch requests', details: err.message });
  }
};

exports.getDegreeRequestByStudentDID = async (req, res) => {
  const { studentDID } = req.params;
  try {
    const request = await DegreeRequest.findOne({ studentDID });
    if (!request) return res.status(404).json({ message: 'No request found' });
    res.json({ message: 'Request fetched', data: request });
  } catch (err) {
    console.error('❌ Get Request Error:', err);
    res.status(500).json({ error: 'Failed to fetch request', details: err.message });
  }
};

exports.issueDegreeToBlockchain = async (req, res) => {
  const { studentDID, degree } = req.body;

  if (!studentDID || !degree) {
    return res.status(400).json({ message: 'Missing studentDID or degree type.' });
  }

  try {
    // 🔍 1. Fetch the degree document
    const degreeDoc = await Degree.findOne({ studentDID, degree });
    if (!degreeDoc) {
      return res.status(404).json({ message: 'Degree record not found for the student.' });
    }

    // ❌ Ensure required fields are present
    if (!degreeDoc.pdfGenerated || !degreeDoc.ipfsHash) {
      return res.status(400).json({ message: 'PDF not generated or IPFS hash missing.' });
    }

    // ✅ Extra safety check before saving to MongoDB
    if (!degreeDoc.ipfsHash || !studentDID) {
      return res.status(400).json({ message: 'Missing required IPFS data or studentDID.' });
    }

    
// ✅ INSERT THIS DEBUG LOG HERE
console.log('Saving to IPFS log:', {
  studentDID,
  ipfsHash: degreeDoc.ipfsHash
});

    // ✅ 2. Re-save the IPFS hash (for logs/history or in case it was not saved before)
    await saveIPFSHashToMongo({
      studentDID,
      studentName: degreeDoc.studentName || 'Unknown',
      studentEmail: degreeDoc.studentEmail || 'N/A',
      degree,
      cgpa: degreeDoc.cgpa || null,
      ipfsHash: degreeDoc.ipfsHash,
      pdfUrl: degreeDoc.pdfUrl || '',
      pdfPath: degreeDoc.pdfPath || '',
      qrCodeUrl: degreeDoc.qrCodeUrl || ''
    });

    // ⛓️ 3. Issue degree to blockchain
    const issuedOn = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const tx = await issueDegree(studentDID, degreeDoc.ipfsHash, issuedOn);
    const txHash = tx.transactionHash;

    // 🧾 4. Save blockchain TX hash to Degree model
    await saveBlockchainHashToMongo(studentDID, degree, txHash);

    // 📝 5. Final status update in Degree model
    degreeDoc.status = 'Issued';
    degreeDoc.issuedOn = issuedOn;
    degreeDoc.txHash = txHash;
    await degreeDoc.save();
    console.log('Final degree saved:', degreeDoc);

    // 🎉 Respond with success
    return res.status(200).json({
      message: 'Degree successfully issued on blockchain.',
      studentDID,
      ipfsHash: degreeDoc.ipfsHash,
      txHash,
      issuedOn
    });

  } catch (error) {
    console.error('❌ Error in issueDegreeToBlockchain:', error);
    return res.status(500).json({
      message: 'Internal server error during degree issuance.',
      error: error.message
    });
  }
};


// @route   GET /api/degree/hash/:studentDID
// @desc    Fetch the IPFS hash stored on blockchain for verification
// @access  Public / Admin / Verifier
exports.getDegreeHashFromBlockchain = async (req, res) => {
  const { studentDID } = req.params;

  if (!studentDID) {
    return res.status(400).json({ message: 'studentDID is required.' });
  }

  try {
    const hash = await getDegreeHash(studentDID);

    if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return res.status(404).json({ message: 'No degree hash found on blockchain for this student.' });
    }

    res.status(200).json({
      message: 'Degree hash fetched successfully.',
      studentDID,
      hash
    });

  } catch (error) {
    console.error('❌ Error fetching degree hash:', error.stack);
    res.status(500).json({ message: 'Error fetching degree hash', error: error.message });
  }
};


// Controller: Fetch degree hash from blockchain
/*
exports.getDegreeHash = async (req, res) => {
  const { studentDID } = req.params;

  try {
    const degreeHash = await getDegreeHash(studentDID);

    if (
      !degreeHash ||
      degreeHash === '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      return res.status(404).json({
        message: 'Degree hash not found on blockchain for this student.',
      });
    }

    res.status(200).json({
      message: 'Degree hash fetched successfully',
      studentDID,
      hash: degreeHash,
    });
  } catch (error) {
    console.error('Error fetching degree hash:', error.stack);
    res.status(500).json({
      message: 'Server error while fetching degree hash',
      details: error.message,
    });
  }
};
*/


exports.updateDegreeStatusAndGeneratePDF = async (req, res) => {
  const { studentDID, status, remark } = req.body;
  if (!studentDID || !status) return res.status(400).json({ message: 'Required fields missing' });

  try {
    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await DegreeRequest.findOne({ studentDID });

    let cgpa = 'N/A', pdfPath = '', pdfUrl = '', ipfsHash = '', blockchainTxHash = '';
    let overallTotalMarks = 0;
    let overallObtainedMarks = 0;

    if (status === 'Approved') {
      const grades = await Grade.find({ studentDID });
      if (!grades.length) return res.status(400).json({ message: 'Grades missing' });

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName || g.course, semester: g.semester });
        return course ? {
          creditHours: course.creditHours,
          qualityPoints: typeof g.qualityPoints === 'number' ? g.qualityPoints : 0
        } : null;
      }));
      const validCourseData = courseData.filter(Boolean);
      const totalCH = validCourseData.reduce((sum, d) => sum + d.creditHours, 0);
      const totalQP = validCourseData.reduce((sum, d) => sum + d.qualityPoints, 0);
      cgpa = totalCH > 0 ? parseFloat((totalQP / totalCH).toFixed(2)) : 0;

      const semesters = [...new Set(grades.map(g => g.semester))].sort();
      const semesterData = await Promise.all(semesters.map(async semester => {
        const semGrades = grades.filter(g => g.semester === semester);
        const courses = await Promise.all(semGrades.map(async grade => {
          const course = await Course.findOne({ courseName: grade.courseName || grade.course });
          if (!course) return null;
          return {
            courseName: grade.courseName || grade.course,
            creditHours: course.creditHours,
            totalMarks: course.totalMarks,
            obtainedMarks: grade.obtainedMarks,
            qualityPoints: grade.qualityPoints?.toFixed(2),
            grade: grade.grade,
          };
        }));

        const validCourses = courses.filter(Boolean);
        const semCH = validCourses.reduce((sum, c) => sum + c.creditHours, 0);
        const semQP = validCourses.reduce((sum, c) => sum + parseFloat(c.qualityPoints), 0);
        const gpa = semCH > 0 ? (semQP / semCH).toFixed(2) : 'N/A';

        const semesterTotalMarks = validCourses.reduce((sum, c) => sum + c.totalMarks, 0);
        const semesterObtainedMarks = validCourses.reduce((sum, c) => sum + c.obtainedMarks, 0);

        overallTotalMarks += semesterTotalMarks;
        overallObtainedMarks += semesterObtainedMarks;

        return {
          semester,
          gpa,
          totalMarks: semesterTotalMarks,
          obtainedMarks: semesterObtainedMarks,
          courses: validCourses
        };
      }));

      const filename = `${studentDID}_degree.pdf`;
      const outputPath = path.join(__dirname, '..', 'degree_pdfs', filename);
      if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      await generateDegreePDF({
        studentName: student.name,
        studentDID,
        degreeTitle: student.degree,
        batchNumber: student.batch,
        resultDate: new Date().toLocaleDateString(),
        issueDate: new Date().toLocaleDateString(),
        cgpa,
        semesters: semesterData,
        overallTotalMarks,
        overallObtainedMarks,
        qrURL: `${baseURL}/verify/${studentDID}`,
        vcSignaturePath: path.join(__dirname, '../uploads/signatures/VC-Signature.png'),
        gcufLogoPath: path.join(__dirname, '../uploads/logo/logo.png'),
        universitySealPath: path.join(__dirname, '../uploads/logo/seal.png'),
        outputPath
      });

      pdfPath = `degree_pdfs/${filename}`;
      pdfUrl = `/degree_pdfs/${filename}`;

      ipfsHash = await uploadToIPFS(outputPath);

      // ✅ Correct object passed here
      await saveIPFSHashToMongo({
        studentDID,
        studentName: student.name,
        studentEmail: student.email || '',
        degree: student.degree,
        cgpa,
        ipfsHash,
        pdfUrl,
        pdfPath,
        qrCodeUrl: `${baseURL}/verify/${studentDID}`
      });

      const issuedOn = Math.floor(Date.now() / 1000);
      const txReceipt = await issueDegree(studentDID, ipfsHash, issuedOn);
      blockchainTxHash = txReceipt.transactionHash;

      await saveBlockchainHashToMongo(studentDID, student.degree, blockchainTxHash);

      await Degree.findOneAndUpdate(
        { studentDID, degree: student.degree },
        {
          studentDID,
          studentName: student.name,
          studentEmail: student.email || '',
          degree: student.degree,
          cgpa,
          blockchainHash: blockchainTxHash,
          ipfsHash,
          status: 'Issued',
          resultDeclarationDate: new Date(),
          issuedOn: new Date(),
          notification: true,
          pdfGenerated: true,
          pdfUrl,
          pdfPath,
          qrCodeUrl: `${baseURL}/verify/${studentDID}`,
        },
        { new: true, upsert: true }
      );
    }

    const updatedRequest = await DegreeRequest.findOneAndUpdate(
      { studentDID },
      {
        studentDID,
        status,
        remark: remark || '',
        cgpa,
        pdfPath,
        pdfUrl,
        ipfsHash,
        blockchainTxHash,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Degree status updated', request: updatedRequest });

  } catch (err) {
    console.error('❌ Update Degree Error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
};



/*
exports.updateDegreeStatusAndGeneratePDF = async (req, res) => {
  const { studentDID, status, remark } = req.body;
  if (!studentDID || !status) return res.status(400).json({ message: 'Required fields missing' });

  try {
    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await DegreeRequest.findOne({ studentDID });

    let cgpa = 'N/A', pdfPath = '', pdfUrl = '', ipfsHash = '', blockchainTxHash = '';
    let overallTotalMarks = 0;
    let overallObtainedMarks = 0;

    if (status === 'Approved') {
      const grades = await Grade.find({ studentDID });
      if (!grades.length) return res.status(400).json({ message: 'Grades missing' });

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName || g.course, semester: g.semester });
        return course ? {
          creditHours: course.creditHours,
          qualityPoints: typeof g.qualityPoints === 'number' ? g.qualityPoints : 0
        } : null;
      }));
      const validCourseData = courseData.filter(Boolean);
      const totalCH = validCourseData.reduce((sum, d) => sum + d.creditHours, 0);
      const totalQP = validCourseData.reduce((sum, d) => sum + d.qualityPoints, 0);
      cgpa = totalCH > 0 ? parseFloat((totalQP / totalCH).toFixed(2)) : 0;

      const semesters = [...new Set(grades.map(g => g.semester))].sort();
      const semesterData = await Promise.all(semesters.map(async semester => {
        const semGrades = grades.filter(g => g.semester === semester);
        const courses = await Promise.all(semGrades.map(async grade => {
          const course = await Course.findOne({ courseName: grade.courseName || grade.course });
          if (!course) return null;
          return {
            courseName: grade.courseName || grade.course,
            creditHours: course.creditHours,
            totalMarks: course.totalMarks,
            obtainedMarks: grade.obtainedMarks,
            qualityPoints: grade.qualityPoints?.toFixed(2),
            grade: grade.grade,
          };
        }));

        const validCourses = courses.filter(Boolean);
        const semCH = validCourses.reduce((sum, c) => sum + c.creditHours, 0);
        const semQP = validCourses.reduce((sum, c) => sum + parseFloat(c.qualityPoints), 0);
        const gpa = semCH > 0 ? (semQP / semCH).toFixed(2) : 'N/A';

        const semesterTotalMarks = validCourses.reduce((sum, c) => sum + c.totalMarks, 0);
        const semesterObtainedMarks = validCourses.reduce((sum, c) => sum + c.obtainedMarks, 0);

        overallTotalMarks += semesterTotalMarks;
        overallObtainedMarks += semesterObtainedMarks;

        return {
          semester,
          gpa,
          totalMarks: semesterTotalMarks,
          obtainedMarks: semesterObtainedMarks,
          courses: validCourses
        };
      }));

      const filename = `${studentDID}_degree.pdf`;
      const outputPath = path.join(__dirname, '..', 'degree_pdfs', filename);
      if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      await generateDegreePDF({
        studentName: student.name,
        studentDID,
        degreeTitle: student.degree,
        batchNumber: student.batch,
        resultDate: new Date().toLocaleDateString(),
        issueDate: new Date().toLocaleDateString(),
        cgpa,
        semesters: semesterData,
        overallTotalMarks,
        overallObtainedMarks,
        qrURL: `${baseURL}/verify/${studentDID}`,
        vcSignaturePath: path.join(__dirname, '../uploads/signatures/VC-Signature.png'),
        gcufLogoPath: path.join(__dirname, '../uploads/logo/logo.png'),
        universitySealPath: path.join(__dirname, '../uploads/logo/seal.png'),
        outputPath
      });

      pdfPath = `degree_pdfs/${filename}`;
      pdfUrl = `/degree_pdfs/${filename}`;

      ipfsHash = await uploadToIPFS(outputPath);
      await saveIPFSHashToMongo(studentDID, student.degree, ipfsHash);

      const issuedOn = Math.floor(Date.now() / 1000);
      const txReceipt = await issueDegree(studentDID, ipfsHash, issuedOn);
      blockchainTxHash = txReceipt.transactionHash;
      await saveBlockchainHashToMongo(studentDID, student.degree, blockchainTxHash);

      await Degree.findOneAndUpdate(
        { studentDID, degree: student.degree },
        {
          studentDID,
          studentName: student.name,
          studentEmail: student.email || '',
          degree: student.degree,
          cgpa,
          blockchainHash: blockchainTxHash,
          ipfsHash,
          status: 'Issued',
          resultDeclarationDate: new Date(),
          issuedOn: new Date(),
          pdfGenerated: true,
          pdfUrl,
          pdfPath,
          qrCodeUrl: `${baseURL}/verify/${studentDID}`,
        },
        { new: true, upsert: true }
      );
    }

    const updatedRequest = await DegreeRequest.findOneAndUpdate(
      { studentDID },
      {
        studentDID,
        status,
        remark: remark || '',
        cgpa,
        pdfPath,
        pdfUrl,
        ipfsHash,
        blockchainTxHash,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Degree status updated', request: updatedRequest });

  } catch (err) {
    console.error('❌ Update Degree Error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
};

*/







/*
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const DegreeRequest = require('../models/DegreeRequest');
const Degree = require('../models/Degree');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const { saveIPFSHashToMongo, saveBlockchainHashToMongo} = require('../blockchain/utils/saveIpfsHash');

const { uploadToIPFS } = require('../blockchain/utils/ipfsUpload');
const { issueDegree, storeDegreeHash, getDegreeHash } = require('../blockchain/contractFunctions'); // ⬅️ Import required contract functions



exports.submitDegreeRequest = async (req, res) => {
  const { studentDID } = req.body;

  if (!studentDID) {
    return res.status(400).json({ message: 'studentDID is required' });
  }

  try {
    const existing = await DegreeRequest.findOne({ studentDID });
    if (existing) {
      return res.status(400).json({ message: 'Degree request already exists for this student' });
    }

    const newRequest = new DegreeRequest({
      studentDID,
      status: 'Pending',
      remark: '',
      createdAt: new Date(),
    });

    await newRequest.save();
    res.status(201).json({ message: 'Degree request submitted successfully', data: newRequest });
  } catch (err) {
    console.error('Create DegreeRequest Error:', err.stack);
    res.status(500).json({ error: 'Failed to submit degree request', details: err.message });
  }
};

exports.getAllDegreeRequests = async (req, res) => {
  try {
    const requests = await DegreeRequest.find().sort({ createdAt: -1 });
    res.json({ message: 'All degree requests fetched', data: requests });
  } catch (err) {
    console.error('Fetch Degree Requests Error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch degree requests', details: err.message });
  }
};


// Controller: Fetch degree hash from blockchain
exports.getDegreeHash = async (req, res) => {
  const { studentDID } = req.params;

  try {
    const hash = await getDegreeHashFromContract(studentDID);

    if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return res.status(404).json({ message: 'Degree hash not found on blockchain for this student.' });
    }

    res.status(200).json({ message: 'Degree hash fetched successfully', studentDID, hash });
  } catch (error) {
    console.error('Error fetching degree hash:', error.stack);
    res.status(500).json({ message: 'Server error while fetching degree hash', details: error.message });
  }
};


exports.getDegreeRequestByStudentDID = async (req, res) => {
  const { studentDID } = req.params;

  try {
    const request = await DegreeRequest.findOne({ studentDID });

    if (!request) {
      return res.status(404).json({ message: 'No degree request found for this student' });
    }

    res.json({ message: 'Degree request fetched', data: request });
  } catch (err) {
    console.error('Get DegreeRequest Error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch degree request', details: err.message });
  }
};


exports.updateDegreeStatusAndGeneratePDF = async (req, res) => {
  const { studentDID, status, remark } = req.body;

  if (!studentDID || !status) {
    return res.status(400).json({ message: 'studentDID and status are required' });
  }

  try {
    let pdfPath = '';
    let pdfUrl = '';
    let cgpa = 'N/A';
    let ipfsHash = '';
    let blockchainTxHash = '';

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await DegreeRequest.findOne({ studentDID });

    if (status === 'Approved') {
      const grades = await Grade.find({ studentDID });
      if (!grades.length) {
        return res.status(400).json({ message: 'No grades found for CGPA calculation' });
      }

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName || g.course, semester: g.semester });
        return course ? {
          creditHours: course.creditHours,
          qualityPoints: typeof g.qualityPoints === 'number' ? g.qualityPoints : 0
        } : null;
      }));

      const validCourseData = courseData.filter(Boolean);
      const totalCH = validCourseData.reduce((sum, d) => sum + d.creditHours, 0);
      const totalQP = validCourseData.reduce((sum, d) => sum + d.qualityPoints, 0);
      cgpa = totalCH > 0 ? parseFloat((totalQP / totalCH).toFixed(2)) : 0;

      if (existingRequest?.status === 'Approved' && existingRequest?.pdfPath) {
        pdfPath = existingRequest.pdfPath;
        pdfUrl = existingRequest.pdfUrl;
      } else {
        const semesters = [...new Set(grades.map(g => g.semester))].sort();
        const semesterData = [];

        for (const semester of semesters) {
          const semGrades = grades.filter(g => g.semester === semester);
          const coursesData = [];
          let semesterQP = 0, semesterCH = 0;

          for (const grade of semGrades) {
            const course = await Course.findOne({ courseName: grade.courseName || grade.course });
            if (!course || !course.creditHours) continue;

            const qPoints = grade.qualityPoints || 0;
            const cHours = course.creditHours || 0;

            semesterQP += qPoints;
            semesterCH += cHours;

            coursesData.push({
              courseName: grade.courseName || grade.course,
              creditHours: cHours,
              totalMarks: course.totalMarks || 'N/A',
              obtainedMarks: grade.obtainedMarks || 'N/A',
              qualityPoints: qPoints.toFixed(2),
              grade: grade.grade,
            });
          }

          const gpa = semesterCH > 0 ? (semesterQP / semesterCH).toFixed(2) : 'N/A';
          semesterData.push({ semester, gpa, courses: coursesData });
        }

        const filename = `${studentDID}.pdf`;
        const pdfFolder = path.join(__dirname, '..', 'degree_pdfs');
        if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

        const absolutePath = path.join(pdfFolder, filename);
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const writeStream = fs.createWriteStream(absolutePath);
        doc.pipe(writeStream);

        doc.fontSize(22).text('Government College University Faisalabad', { align: 'center' });
        doc.fontSize(16).text('Official Degree Certificate', { align: 'center' }).moveDown();

        doc.fontSize(12).text(`Name: ${student.name}`);
        doc.text(`DID: ${student.did}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`CNIC: ${student.cnic}`);
        doc.text(`Batch: ${student.batch}`);
        doc.text(`Degree: ${student.degree}`).moveDown();

        const issueDate = new Date().toLocaleDateString();
        doc.text(`Issue Date: ${issueDate}`);
        doc.text(`Result Declaration Date: ${issueDate}`);
        doc.text(`Final CGPA: ${cgpa}`).moveDown();

        for (const sem of semesterData) {
          doc.fontSize(13).text(`Semester ${sem.semester}`, { underline: true });
          for (const course of sem.courses) {
            doc.fontSize(11).text(
              `• ${course.courseName} | Credit Hours: ${course.creditHours}, Marks: ${course.obtainedMarks}/${course.totalMarks}, Quality Points: ${course.qualityPoints}, Grade: ${course.grade}`
            );
          }
          doc.text(`GPA: ${sem.gpa}`).moveDown();
        }

        doc.moveDown(2);
        doc.text('______________________', 100);
        doc.text('Vice Chancellor', 100);
        doc.text('______________________', 350);
        doc.text('Governor', 350);
        doc.end();

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        pdfPath = `degree_pdfs/${filename}`;
        pdfUrl = `/degree_pdfs/${filename}`;

        // Upload to IPFS & Blockchain
        ipfsHash = await uploadToIPFS(absolutePath);
        await saveIPFSHashToMongo(studentDID, student.degree, ipfsHash);

        await issueDegree(studentDID, student.name, student.degree, parseFloat(cgpa));
        const txReceipt = await storeDegreeHash(studentDID, ipfsHash);
        blockchainTxHash = txReceipt.transactionHash;

        await saveBlockchainHashToMongo(studentDID, student.degree, blockchainTxHash);
      }
    }

    const updatedRequest = await DegreeRequest.findOneAndUpdate(
      { studentDID },
      {
        status,
        remark,
        pdfPath,
        pdfUrl,
        approvedAt: status === 'Approved' ? new Date() : null,
      },
      { new: true, upsert: true }
    );

    if (status === 'Approved') {
      let degree = await Degree.findOne({ studentDID });
      if (!degree) {
        degree = new Degree({
          studentDID,
          studentName: student.name || 'N/A',
          studentEmail: student.email || 'N/A',
          degree: student.degree || 'N/A',
          cgpa: isNaN(parseFloat(cgpa)) ? 0 : parseFloat(cgpa),
          status: 'Issued',
          issuedOn: new Date(),
          blockchainHash: blockchainTxHash,
          resultDeclarationDate: new Date(),
          pdfPath,
          pdfUrl,
          pdfGenerated: true,
        });
      } else {
        degree.status = 'Issued';
        degree.issuedOn = new Date();
        degree.cgpa = isNaN(parseFloat(cgpa)) ? 0 : parseFloat(cgpa);
        degree.pdfPath = pdfPath;
        degree.pdfUrl = pdfUrl;
        degree.pdfGenerated = true;
        degree.blockchainHash = blockchainTxHash;
      }

      await degree.save();
    }

    res.json({
      message: 'Degree request updated and PDF generated',
      pdfUrl: status === 'Approved' ? pdfUrl : null,
      data: updatedRequest,
    });
  } catch (err) {
    console.error('PDF Generation Error:', err.stack);
    res.status(500).json({ error: 'Failed to process degree request', details: err.message });
  }
};

*/


/*
exports.updateDegreeStatusAndGeneratePDF = async (req, res) => {
  const { studentDID, status, remark } = req.body;

  if (!studentDID || !status) {
    return res.status(400).json({ message: 'studentDID and status are required' });
  }

  try {
    let pdfPath = '';
    let pdfUrl = '';
    let cgpa = 'N/A';
    let ipfsHash = '';

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await DegreeRequest.findOne({ studentDID });

    if (status === 'Approved') {
      const grades = await Grade.find({ studentDID });
      if (!grades.length) {
        return res.status(400).json({ message: 'No grades found for CGPA calculation' });
      }

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName || g.course, semester: g.semester });
        return course ? {
          creditHours: course.creditHours,
          qualityPoints: typeof g.qualityPoints === 'number' ? g.qualityPoints : 0
        } : null;
      }));

      const validCourseData = courseData.filter(Boolean);
      const totalCH = validCourseData.reduce((sum, d) => sum + d.creditHours, 0);
      const totalQP = validCourseData.reduce((sum, d) => sum + d.qualityPoints, 0);
      cgpa = totalCH > 0 ? parseFloat((totalQP / totalCH).toFixed(2)) : 0;

      if (existingRequest?.status === 'Approved' && existingRequest?.pdfPath) {
        pdfPath = existingRequest.pdfPath;
        pdfUrl = existingRequest.pdfUrl;
      } else {
        const semesters = [...new Set(grades.map(g => g.semester))].sort();
        const semesterData = [];

        for (const semester of semesters) {
          const semGrades = grades.filter(g => g.semester === semester);
          const coursesData = [];
          let semesterQP = 0, semesterCH = 0;

          for (const grade of semGrades) {
            const course = await Course.findOne({ courseName: grade.courseName || grade.course });
            if (!course || !course.creditHours) continue;
            const qPoints = grade.qualityPoints || 0;
            const cHours = course.creditHours || 0;

            semesterQP += qPoints;
            semesterCH += cHours;

            coursesData.push({
              courseName: grade.courseName || grade.course,
              creditHours: cHours,
              totalMarks: course.totalMarks || 'N/A',
              obtainedMarks: grade.obtainedMarks || 'N/A',
              qualityPoints: qPoints.toFixed(2),
              grade: grade.grade,
            });
          }

          const gpa = semesterCH > 0 ? (semesterQP / semesterCH).toFixed(2) : 'N/A';
          semesterData.push({ semester, gpa, courses: coursesData });
        }

        const filename = `${studentDID}.pdf`;
        const pdfFolder = path.join(__dirname, '..', 'degree_pdfs');
        if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

        const absolutePath = path.join(pdfFolder, filename);
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const writeStream = fs.createWriteStream(absolutePath);
        doc.pipe(writeStream);

        doc.fontSize(22).text('Government College University Faisalabad', { align: 'center' });
        doc.fontSize(16).text('Official Degree Certificate', { align: 'center' }).moveDown();

        doc.fontSize(12).text(`Name: ${student.name}`);
        doc.text(`DID: ${student.did}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`CNIC: ${student.cnic}`);
        doc.text(`Batch: ${student.batch}`);
        doc.text(`Degree: ${student.degree}`).moveDown();

        const issueDate = new Date().toLocaleDateString();
        doc.text(`Issue Date: ${issueDate}`);
        doc.text(`Result Declaration Date: ${issueDate}`);
        doc.text(`Final CGPA: ${cgpa}`).moveDown();

        for (const sem of semesterData) {
          doc.fontSize(13).text(`Semester ${sem.semester}`, { underline: true });
          for (const course of sem.courses) {
            doc.fontSize(11).text(
              `• ${course.courseName} | Credit Hours: ${course.creditHours}, Marks: ${course.obtainedMarks}/${course.totalMarks}, Quality Points: ${course.qualityPoints}, Grade: ${course.grade}`
            );
          }
          doc.text(`GPA: ${sem.gpa}`).moveDown();
        }

        doc.moveDown(2);
        doc.text('______________________', 100);
        doc.text('Vice Chancellor', 100);
        doc.text('______________________', 350);
        doc.text('Governor', 350);
        doc.end();

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        pdfPath = `degree_pdfs/${filename}`;
        pdfUrl = `/degree_pdfs/${filename}`;

        // 🔥 Upload to IPFS and save hash in MongoDB and Blockchain
        try {
          ipfsHash = await uploadToIPFS(absolutePath);
          await saveIPFSHashToMongo(studentDID, student.degree, ipfsHash);

          // ⛓️ Call Smart Contract to store on blockchain
          await issueDegree(studentDID, student.name, student.degree, parseFloat(cgpa));
          await storeDegreeHash(studentDID, ipfsHash);
        } catch (blockchainError) {
          console.error('❌ Blockchain/IPFS Error:', blockchainError.message);
        }
      }
    }

    const updatedRequest = await DegreeRequest.findOneAndUpdate(
      { studentDID },
      {
        status,
        remark,
        pdfPath,
        pdfUrl,
        approvedAt: status === 'Approved' ? new Date() : null,
      },
      { new: true, upsert: true }
    );

    if (status === 'Approved') {
      let degree = await Degree.findOne({ studentDID });
      if (!degree) {
        degree = new Degree({
          studentDID,
          studentName: student.name || 'N/A',
          studentEmail: student.email || 'N/A',
          degree: student.degree || 'N/A',
          cgpa: isNaN(parseFloat(cgpa)) ? 0 : parseFloat(cgpa),
          status: 'Issued',
          issuedOn: new Date(),
          blockchainHash: ipfsHash,
          resultDeclarationDate: new Date(),
          pdfPath,
          pdfUrl,
          pdfGenerated: true,
        });
      } else {
        degree.status = 'Issued';
        degree.issuedOn = new Date();
        degree.cgpa = isNaN(parseFloat(cgpa)) ? 0 : parseFloat(cgpa);
        degree.pdfPath = pdfPath;
        degree.pdfUrl = pdfUrl;
        degree.pdfGenerated = true;
        degree.blockchainHash = ipfsHash;
      }

      await degree.save();
    }

    res.json({
      message: 'Degree request updated and PDF generated',
      pdfUrl: status === 'Approved' ? pdfUrl : null,
      data: updatedRequest,
    });
  } catch (err) {
    console.error('PDF Generation Error:', err.stack);
    res.status(500).json({ error: 'Failed to process degree request', details: err.message });
  }
};
*/
