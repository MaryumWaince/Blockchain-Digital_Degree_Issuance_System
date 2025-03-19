const express = require('express');
const { getStudentInfo, assignGrade } = require('../controllers/facultyController');
const router = express.Router();

router.get('/:studentDID', getStudentInfo);
router.post('/assign-grade', assignGrade);

module.exports = router;
