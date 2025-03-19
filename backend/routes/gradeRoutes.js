const express = require('express');
const { recordGrade, getGrades } = require('../controllers/gradeController');
const router = express.Router();

router.post('/record', recordGrade);
router.get('/:studentDID', getGrades);

module.exports = router;

