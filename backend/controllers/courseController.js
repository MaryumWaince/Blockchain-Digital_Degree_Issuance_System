const Course = require('../models/Course');

// Add courses for a degree and semester
const addCourses = async (req, res) => {
  try {
    const { degree, semester, courses } = req.body;
    const newCourse = new Course({ degree, semester, courses });
    await newCourse.save();

    res.status(201).json({ message: 'Courses added successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get courses for a specific degree and semester
const getCourses = async (req, res) => {
  try {
    const { degree, semester } = req.params;
    const courses = await Course.findOne({ degree, semester });

    if (!courses) {
      return res.status(404).json({ message: 'No courses found' });
    }
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addCourses, getCourses };
