const Grade = require('../models/Grade');
const Course = require('../models/Course');

// Utility: Calculate grade + quality points
const calculateGradeDetails = (obtainedMarks, totalMarks, creditHours) => {
  const percentage = (obtainedMarks / totalMarks) * 100;
  let grade = 'F';
  let gradePoint = 0;

  if (percentage >= 80) { grade = 'A'; gradePoint = 4.0; }
  else if (percentage >= 70) { grade = 'B'; gradePoint = 3.0; }
  else if (percentage >= 60) { grade = 'C'; gradePoint = 2.0; }
  else if (percentage >= 50) { grade = 'D'; gradePoint = 1.0; }

  const qualityPoints = gradePoint * creditHours;
  return { grade, qualityPoints };
};

// ✅ POST: Submit or update grade
exports.submitGrade = async (req, res) => {
  const { studentDID, courseName, semester, obtainedMarks } = req.body;

  if (!studentDID || !courseName || semester == null || obtainedMarks == null) {
    return res.status(400).json({
      message: 'Fields required: studentDID, courseName, semester, obtainedMarks'
    });
  }

  try {
    const courseData = await Course.findOne({ courseName, semester });
    if (!courseData) {
      return res.status(404).json({ message: 'Course not found for the given semester' });
    }

    const { creditHours, totalMarks } = courseData;
    const { grade, qualityPoints } = calculateGradeDetails(obtainedMarks, totalMarks, creditHours);

    let existing = await Grade.findOne({ studentDID, courseName, semester });

    if (existing) {
      existing.obtainedMarks = obtainedMarks;
      existing.grade = grade;
      existing.qualityPoints = qualityPoints;
      await existing.save();
      return res.status(200).json({ message: 'Grade updated successfully', data: existing });
    }

    const newGrade = new Grade({
      studentDID,
      courseName,
      semester,
      obtainedMarks,
      grade,
      qualityPoints
    });

    await newGrade.save();
    res.status(201).json({ message: 'Grade submitted successfully', data: newGrade });

  } catch (err) {
    res.status(500).json({ message: 'Server error during grade submission', error: err.message });
  }
};

// ✅ GET: Grades by studentDID with course details
exports.getGradesByDID = async (req, res) => {
  try {
    const grades = await Grade.find({ studentDID: req.params.studentDID });

    const enrichedGrades = await Promise.all(
      grades.map(async (grade) => {
        const course = await Course.findOne({ courseName: grade.courseName, semester: grade.semester });
        return {
          ...grade._doc,
          creditHours: course?.creditHours || null,
          totalMarks: course?.totalMarks || null
        };
      })
    );

    res.status(200).json(enrichedGrades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message });
  }
};

