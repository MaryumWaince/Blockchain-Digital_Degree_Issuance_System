const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');

// ✅ POST: Add a single course with duplicate check
router.post('/single', async (req, res) => {
  try {
    const { courseCode, courseName, creditHours, totalMarks, degree, semester } = req.body;

    if (!courseCode || !courseName || !creditHours || !totalMarks || !degree || semester == null) {
      return res.status(400).json({ error: 'Missing required course fields.' });
    }

    // Prevent duplicate courseCode+degree+semester
    const exists = await Course.findOne({ courseCode, degree, semester });
    if (exists) {
      return res.status(409).json({ error: 'Course already exists for this degree and semester.' });
    }

    const newCourse = new Course({
      courseCode,
      courseName,
      creditHours,
      totalMarks,
      degree,
      semester
    });

    const saved = await newCourse.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Add Course Error:', err);
    res.status(500).json({ error: 'Failed to add course', details: err.message });
  }
});

// ✅ POST: Add multiple courses at once
router.post('/', async (req, res) => {
  const { degree, semester, courses } = req.body;

  if (!degree || semester == null || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({
      message: 'Missing or invalid input. Ensure degree, semester, and courses array are provided.'
    });
  }

  try {
    const createdCourses = await Promise.all(
      courses.map(course =>
        new Course({
          degree,
          semester,
          courseName: course.courseName,
          courseCode: course.courseCode,
          creditHours: course.creditHours,
          totalMarks: course.totalMarks
        }).save()
      )
    );

    res.status(201).json({ message: 'Courses added successfully', data: createdCourses });
  } catch (err) {
    console.error('Error saving courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET: All courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching all courses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: Courses for specific degree and semester
router.get('/:degree/:semester', async (req, res) => {
  try {
    const courses = await Course.find({
      degree: req.params.degree,
      semester: req.params.semester
    });
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: Courses for student by DID (based on paid semesters)
router.get('/student/:did', async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const paidSemesters = (student.feeStatus || [])
      .filter(fee => fee.status === 'paid')
      .map(fee => fee.semester);

    const courses = await Course.find({
      degree: student.degree,
      semester: { $in: paidSemesters }
    });

    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses by student:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: Get course by name and semester (used for grade matching)
router.get('/name/:courseName/:semester', async (req, res) => {
  try {
    const { courseName, semester } = req.params;
    const course = await Course.findOne({ courseName, semester });

    if (!course) {
      return res.status(404).json({ message: 'Course not found for this semester' });
    }

    res.status(200).json(course);
  } catch (err) {
    console.error('Error fetching course by name/semester:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


/*
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');

// ✅ POST: Add multiple full course objects for a degree and semester
router.post('/', async (req, res) => {
  const { degree, semester, courses } = req.body;

  if (!degree || semester == null || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({
      message: 'Missing or invalid input. Ensure degree, semester, and courses array are provided.'
    });
  }

  try {
    const createdCourses = await Promise.all(
      courses.map(course =>
        new Course({
          degree,
          semester,
          courseName: course.courseName,
          courseCode: course.courseCode,
          creditHours: course.creditHours,
          totalMarks: course.totalMarks
        }).save()
      )
    );

    res.status(201).json({ message: 'Courses added successfully', data: createdCourses });
  } catch (err) {
    console.error('Error saving courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET: Get all courses for a specific degree and semester
router.get('/:degree/:semester', async (req, res) => {
  try {
    const courses = await Course.find({
      degree: req.params.degree,
      semester: req.params.semester
    });
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: Get courses for a student based on paid semesters
router.get('/student/:did', async (req, res) => {
  try {
    const student = await Student.findOne({ did: req.params.did });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const paidSemesters = (student.feeStatus || [])
      .filter(fee => fee.status === 'paid')
      .map(fee => fee.semester);

    const courses = await Course.find({
      degree: student.degree,
      semester: { $in: paidSemesters }
    });

    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses by student:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ NEW: Get course by name and semester (used in grade submission)
router.get('/name/:courseName/:semester', async (req, res) => {
  try {
    const { courseName, semester } = req.params;
    const course = await Course.findOne({ courseName, semester });

    if (!course) {
      return res.status(404).json({ message: 'Course not found for this semester' });
    }

    res.status(200).json(course);
  } catch (err) {
    console.error('Error fetching course by name/semester:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

*/
