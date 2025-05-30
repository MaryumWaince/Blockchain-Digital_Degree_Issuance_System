const express = require('express');
const crypto = require('crypto');
const Student = require('../models/Student');

const router = express.Router();

// ✅ Register a new Student (DID + PrivateKey)
router.post('/register', async (req, res) => {
  const { name, cnic, email, contact, degree, batch, fingerprintHash } = req.body;

  if (!name || !cnic || !email || !contact || !degree || !batch) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // 1. Generate raw private key and DID
    const rawPrivateKey = crypto.randomBytes(32).toString('hex');
    const did = crypto.createHash('sha256').update(rawPrivateKey).digest('hex');

    // 2. Create new student document
    const newStudent = new Student({
      did,
      privateKey: rawPrivateKey,
      name,
      cnic,
      email,
      contact,
      degree,
      batch,
      fingerprintHash,
      feeStatus: [],
      grades: [],
      attendance: [],
      reenrollmentRequests: [],
      gpaBySemester: {},
      cgpa: 0
    });

    await newStudent.save();

    // 3. Return only public info
    res.status(201).json({
      message: 'Student registered successfully',
      did,
      privateKey: rawPrivateKey
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Login Student with DID + Private Key
router.post('/login', async (req, res) => {
  const { did, privateKey } = req.body;

  try {
    const student = await Student.findOne({ did });
    if (!student) {
      return res.status(401).json({ message: 'Invalid DID' });
    }

    if (student.privateKey !== privateKey) {
      return res.status(401).json({ message: 'Invalid Private Key' });
    }

    res.status(200).json({
      message: 'Login successful',
      did
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get Full Student Profile by DID (without privateKey)
router.get('/:did', async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { privateKey, ...publicData } = student.toObject();
    res.status(200).json(publicData);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Submit Reenrollment Request
router.post('/:did/reenrollment', async (req, res) => {
  const { semester, courses } = req.body;
  const { did } = req.params;

  if (!semester || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ message: 'Invalid semester or course list' });
  }

  try {
    const student = await Student.findOne({ did });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Add new reenrollment request
    student.reenrollmentRequests.push({
      semester,
      courses
    });

    await student.save();
    res.status(200).json({ message: 'Reenrollment request submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
