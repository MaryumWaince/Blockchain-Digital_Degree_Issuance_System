const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const DegreeRequest = require('../models/DegreeRequest');
const Degree = require('../models/Degree');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');

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

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await DegreeRequest.findOne({ studentDID });

    if (status === 'Approved') {
      // --- CGPA recalculation logic from your snippet ---
      console.log('Calculating CGPA for:', studentDID);

      const grades = await Grade.find({ studentDID });

      if (!grades.length) {
        return res.status(400).json({ message: 'No grades found for CGPA calculation' });
      }

      const courseData = await Promise.all(grades.map(async g => {
        const course = await Course.findOne({ courseName: g.courseName || g.course, semester: g.semester });
        if (!course) {
          console.warn(`Missing course for "${g.courseName || g.course}" in semester ${g.semester}`);
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
      // --- end CGPA recalculation ---

      if (existingRequest?.status === 'Approved' && existingRequest?.pdfPath) {
        pdfPath = existingRequest.pdfPath;
        pdfUrl = existingRequest.pdfUrl;
      } else {
        const semesters = [...new Set(grades.map(g => g.semester))].sort();

        const semesterData = [];
        let totalQualityPoints = 0;
        let totalCreditHours = 0;

        for (const semester of semesters) {
          const semGrades = grades.filter(g => g.semester === semester);
          const coursesData = [];

          let semesterQP = 0;
          let semesterCH = 0;

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
          totalQualityPoints += semesterQP;
          totalCreditHours += semesterCH;

          semesterData.push({
            semester,
            gpa,
            courses: coursesData,
          });
        }

        // We already computed cgpa above, so no need to re-compute here again.

        const filename = `${studentDID}.pdf`;
        const pdfFolder = path.join(__dirname, '..', 'degree_pdfs');
        if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

        const absolutePath = path.join(pdfFolder, filename);
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const writeStream = fs.createWriteStream(absolutePath);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(22).text('Government College University Faisalabad', { align: 'center' });
        doc.fontSize(16).text('Official Degree Certificate', { align: 'center' });
        doc.moveDown();

        // Student Info
        doc.fontSize(12).text(`Name: ${student.name}`);
        doc.text(`DID: ${student.did}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`CNIC: ${student.cnic}`);
        doc.text(`Batch: ${student.batch}`);
        doc.text(`Degree: ${student.degree}`);
        doc.moveDown();

        //doc.text(`Status: Approved`);
        //doc.text(`Remark: ${remark || 'None'}`);
        const issueDate = new Date().toLocaleDateString();
        doc.text(`Issue Date: ${issueDate}`);
        doc.text(`Result Declaration Date: ${issueDate}`);
        doc.text(`Final CGPA: ${cgpa}`);
        doc.moveDown();

        // Semester-wise Data
        for (const sem of semesterData) {
          doc.fontSize(13).text(`Semester ${sem.semester}`, { underline: true });
          for (const course of sem.courses) {
            doc.fontSize(11).text(
              `• ${course.courseName} | Credit Hours: ${course.creditHours}, Marks: ${course.obtainedMarks}/${course.totalMarks}, Quality Points: ${course.qualityPoints}, Grade: ${course.grade}`
            );
          }
          doc.text(`GPA: ${sem.gpa}`);
          doc.moveDown();
        }

        // Signatures
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
          blockchainHash: '',
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
