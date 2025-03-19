const Student = require('../models/Student');
const { generateDID, encryptData, generatePrivateKey } = require('../utils/cryptoUtils');
const { generateZKP, verifyZKP } = require('../utils/zkpUtils'); // ✅ Importing from utils

// Register New Student
const registerStudent = async (req, res) => {
  try {
    const { name, cnic, contactNo, email, degree, batch } = req.body;
    const privateKey = generatePrivateKey();
    const did = generateDID(name, cnic);
    const encryptedData = encryptData(JSON.stringify({ name, cnic, contactNo, email, degree, batch }));

    const student = new Student({ name, cnic, contactNo, email, degree, batch, did, privateKey, encryptedData });
    await student.save();

    res.status(201).json({ message: 'Student registered successfully', did, privateKey });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Retrieve All Students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch a Student by DID
const getStudentByDID = async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { name, cnic, contactNo, email, degree, batch, did } = student;
    res.status(200).json({ name, cnic, contactNo, email, degree, batch, did });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Generate ZKP for Login
const generateZKPForLogin = (req, res) => {
  try {
    const { privateKey, challenge } = req.body;
    if (!privateKey || !challenge) {
      return res.status(400).json({ message: 'Private key and challenge are required' });
    }
    const zkp = generateZKP(privateKey, challenge);
    res.status(200).json({ zkp });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Verify ZKP for Login
const verifyZKPForLogin = async (req, res) => {
  try {
    const { did, zkp, challenge } = req.body;

    if (!did || !zkp || !challenge) {
      return res.status(400).json({ message: 'DID, ZKP, and challenge are required' });
    }

    const student = await Student.findOne({ did });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const isValid = verifyZKP(zkp, student.privateKey, challenge);

    if (isValid) {
      res.status(200).json({ message: 'ZKP Authentication Successful' });
    } else {
      res.status(401).json({ message: 'Authentication Failed' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  registerStudent, 
  getStudents, 
  getStudentByDID, 
  generateZKPForLogin, 
  verifyZKPForLogin 
};
