const express = require('express');
const crypto = require('crypto');
const Student = require('../models/Student');

const router = express.Router();

// ✅ Student Registration (Raw Private Key + DID)
router.post('/register', async (req, res) => {
  const { name, cnic, email, contact, degree, batch } = req.body;

  if (!name || !cnic || !email || !contact || !degree || !batch) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // 1. Generate raw private key and DID
    const rawPrivateKey = crypto.randomBytes(32).toString('hex');
    const did = crypto.createHash('sha256').update(rawPrivateKey).digest('hex');

    // 2. Save raw private key (not hashed)
    const student = new Student({
      did,
      privateKey: rawPrivateKey,
      name,
      email,
      contact,
      cnic,
      degree,
      batch,
      feeStatus: 'unpaid',
      grades: [],
      attendance: []
    });

    await student.save();

    // 3. Return DID and private key to frontend
    res.status(201).json({
      message: 'Student registered successfully',
      did,
      privateKey: rawPrivateKey
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Student Login (Match raw private key)
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

// ✅ Get Student Profile by DID
router.get('/:did', async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove private key before sending response
    const { privateKey, ...safeStudent } = student.toObject();
    res.status(200).json(safeStudent);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
