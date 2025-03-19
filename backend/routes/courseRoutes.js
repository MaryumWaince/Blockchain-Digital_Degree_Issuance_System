const express = require('express');
const { addCourses, getCourses } = require('../controllers/courseController');
const router = express.Router();

router.post('/add', addCourses);
router.get('/:degree/:semester', getCourses);

module.exports = router;

