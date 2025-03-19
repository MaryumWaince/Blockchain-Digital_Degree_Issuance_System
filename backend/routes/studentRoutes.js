const express = require('express');
const { 
    registerStudent, 
    getStudents, 
    getStudentByDID,  // New controller function
    generateZKPForLogin, 
    verifyZKPForLogin 
} = require('../controllers/studentController');

const router = express.Router();

// Student Registration & Retrieval
router.post('/register', registerStudent);
router.get('/', getStudents);
router.get('/:did', getStudentByDID); // Route to fetch student by DID

// ZKP Authentication Routes
router.post('/generate-zkp', generateZKPForLogin);
router.post('/verify-zkp', verifyZKPForLogin);

module.exports = router;
