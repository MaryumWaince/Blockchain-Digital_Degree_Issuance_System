const Student = require('../models/Student');
const { generateDID, encryptData, generatePrivateKey } = require('../utils/cryptoUtils');
const { generateZKP, verifyZKP } = require('../utils/zkpUtils');

// ✅ Register New Student
const registerStudent = async (req, res) => {
  try {
    const { name, cnic, contactNo, email, degree, batch } = req.body;

    if (!name || !cnic || !contactNo || !email || !degree || !batch) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for duplicate CNIC or email
    const existingStudent = await Student.findOne({ $or: [{ cnic }, { email }] });
    if (existingStudent) {
      return res.status(409).json({ message: 'Student with this CNIC or email already exists' });
    }

    const privateKey = generatePrivateKey();
    const did = generateDID(name, cnic);
    const encryptedData = encryptData(JSON.stringify({ name, cnic, contactNo, email, degree, batch }));

    const student = new Student({ name, cnic, contactNo, email, degree, batch, did, privateKey, encryptedData });
    await student.save();

    res.status(201).json({
      message: 'Student registered successfully',
      did,
      privateKey // Sent once only
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ✅ Retrieve All Students (Admin Use)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-privateKey -encryptedData -__v -_id');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// ✅ Fetch a Student by DID (e.g., for Student Dashboard)
const getStudentByDID = async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did }).select('-privateKey -encryptedData -__v -_id');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Generate ZKP for Login (Frontend call)
const generateZKPForLogin = (req, res) => {
  try {
    const { privateKey, challenge } = req.body;

    if (!privateKey || !challenge) {
      return res.status(400).json({ message: 'Private key and challenge are required' });
    }

    const zkp = generateZKP(privateKey, challenge);
    res.status(200).json({ zkp });
  } catch (error) {
    res.status(500).json({ message: 'Error generating ZKP', error: error.message });
  }
};

// ✅ Verify ZKP for Login (Backend verification)
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
      res.status(200).json({ message: 'ZKP Authentication Successful', did });
    } else {
      res.status(401).json({ message: 'Authentication Failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'ZKP verification failed', error: error.message });
  }
};

module.exports = {
  registerStudent,
  getStudents,
  getStudentByDID,
  generateZKPForLogin,
  verifyZKPForLogin
};
