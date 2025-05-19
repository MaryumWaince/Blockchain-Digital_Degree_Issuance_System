const Course = require('../models/Course');

// ✅ Add multiple courses individually
const addCourses = async (req, res) => {
  try {
    const { degree, semester, courses } = req.body;

    if (!degree || semester == null || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        message: 'Missing or invalid input. Ensure degree, semester, and courses array are provided.'
      });
    }

    const courseDocs = courses.map(course => ({
      degree,
      semester,
      courseName: course.courseName,
      courseCode: course.courseCode,
      creditHours: course.creditHours,
      totalMarks: course.totalMarks
    }));

    await Course.insertMany(courseDocs);
    res.status(201).json({ message: 'Courses added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Fetch courses for a given degree and semester
const getCourses = async (req, res) => {
  try {
    const { degree, semester } = req.params;
    const courses = await Course.find({ degree, semester });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'No courses found' });
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addCourses, getCourses };
