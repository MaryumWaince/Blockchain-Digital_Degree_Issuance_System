const Fee = require('../models/Fee');
const Student = require('../models/Student');

// ✅ POST /api/fees/pay
exports.payFee = async (req, res) => {
  const { studentDID, semester, degree, status } = req.body;

  if (!studentDID || !semester || !degree || !status) {
    return res.status(400).json({ message: 'All fields are required (studentDID, semester, degree, status)' });
  }

  const semesterNum = Number(semester);
  if (isNaN(semesterNum)) {
    return res.status(400).json({ message: 'Semester must be a valid number' });
  }

  try {
    let fee = await Fee.findOne({ studentDID, semester: semesterNum });

    if (fee) {
      fee.status = status;
      fee.degree = degree;
      await fee.save();
    } else {
      fee = new Fee({ studentDID, semester: semesterNum, degree, status });
      await fee.save();
    }

    const student = await Student.findOne({ did: studentDID });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingFeeStatus = student.feeStatus.find(f => f.semester === semesterNum);
    if (existingFeeStatus) {
      existingFeeStatus.status = status;
    } else {
      student.feeStatus.push({ semester: semesterNum, status });
    }

    await student.save();

    res.status(200).json({
      message: 'Fee record stored and student updated',
      fee
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ GET /api/fees/filter
exports.filterFees = async (req, res) => {
  const { did, semester, degree } = req.query;
  const query = {};

  if (did) query.studentDID = did;
  if (semester) {
    const semesterNum = Number(semester);
    if (isNaN(semesterNum)) return res.status(400).json({ message: 'Semester must be a number' });
    query.semester = semesterNum;
  }
  if (degree) query.degree = degree;

  try {
    const filtered = await Fee.find(query);
    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ GET /api/fees/:studentDID
exports.getFeePayments = async (req, res) => {
  const { studentDID } = req.params;

  if (!studentDID) {
    return res.status(400).json({ message: 'Student DID is required' });
  }

  try {
    const fees = await Fee.find({ studentDID });
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fee records', error: err.message });
  }
};



/*
const Fee = require('../models/Fee');
const Student = require('../models/Student');

// ✅ POST /api/fees/pay - Store or update a fee record AND update student feeStatus if paid
exports.payFee = async (req, res) => {
  const { studentDID, semester, degree, status } = req.body;

  if (!studentDID || !semester || !degree || !status) {
    return res.status(400).json({
      message: 'All fields are required (studentDID, semester, degree, status)'
    });
  }

  const semesterNum = Number(semester);
  if (isNaN(semesterNum)) {
    return res.status(400).json({ message: 'Semester must be a valid number' });
  }

  try {
    // Create or update Fee record
    let fee = await Fee.findOne({ studentDID, semester: semesterNum });

    if (fee) {
      fee.status = status;
      fee.degree = degree;
      await fee.save();
    } else {
      fee = new Fee({ studentDID, semester: semesterNum, degree, status });
      await fee.save();
    }

    // Sync feeStatus inside Student collection
    const student = await Student.findOne({ did: studentDID });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const existingFeeStatus = student.feeStatus.find(fee => fee.semester === semesterNum);

    if (existingFeeStatus) {
      existingFeeStatus.status = status;
    } else {
      student.feeStatus.push({ semester: semesterNum, status });
    }

    await student.save();

    res.status(fee ? 200 : 201).json({
      message: fee ? 'Fee status updated and student feeStatus synced' : 'Fee recorded and student feeStatus synced',
      fee
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error while storing fee',
      error: err.message
    });
  }
};

// ✅ GET /api/fees/:studentDID - Get all fee records for one student
exports.getFeePayments = async (req, res) => {
  const { studentDID } = req.params;

  if (!studentDID) {
    return res.status(400).json({
      message: 'Student DID is required in the URL'
    });
  }

  try {
    const records = await Fee.find({ studentDID });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({
      message: 'Server error while fetching fee records',
      error: err.message
    });
  }
};

// ✅ GET /api/fees/filter?did=&semester=&degree= - Filter fees based on optional query params
exports.filterFees = async (req, res) => {
  const { did, semester, degree } = req.query;
  const query = {};

  if (did) query.studentDID = did;  // 👈 Maps frontend 'did' to MongoDB 'studentDID'

  if (semester) {
    const semesterNum = Number(semester);
    if (isNaN(semesterNum)) {
      return res.status(400).json({ message: 'Semester must be a valid number' });
    }
    query.semester = semesterNum;
  }

  if (degree) query.degree = degree;

  try {
    const filtered = await Fee.find(query);
    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({
      message: 'Server error while filtering fee data',
      error: err.message
    });
  }
};
*/
