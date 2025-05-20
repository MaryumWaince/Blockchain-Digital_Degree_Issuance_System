const express = require('express');
const router = express.Router();
const reEnrollmentController = require('../controllers/reenrollmentController');

// POST: Student submits re-enrollment request
router.post('/', reEnrollmentController.submitRequest);

// GET: Faculty retrieves approved re-enrollment requests
router.get('/approved', reEnrollmentController.getApprovedCourses);

// GET: Student fetches their own re-enrollment requests
router.get('/student/:did', reEnrollmentController.getRequestsByStudentDID); // ✅ This must match frontend

// GET: Retrieve all re-enrollment requests (HOD/Admin)
router.get('/', reEnrollmentController.getAllRequests);

// PATCH: Update approval status (HOD)
router.patch('/:id/status', reEnrollmentController.updateRequestStatus);

module.exports = router;




/*
const express = require('express');
const router = express.Router();
const ReEnrollment = require('../models/ReEnrollment');

// POST: Submit re-enrollment request
router.post('/', async (req, res) => {
  try {
    const { studentDID, semester, reason, courses } = req.body;

    // Validate required fields
    if (!studentDID || !semester || !reason || !courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: 'Missing required fields or invalid format.' });
    }

    const request = new ReEnrollment({
      studentDID,
      semester,
      reason,
      courses
    });

    await request.save();
    res.status(201).json({ message: 'Re-enrollment request submitted successfully.', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Retrieve all re-enrollment requests (for HOD/Admin)
router.get('/', async (req, res) => {
  try {
    const requests = await ReEnrollment.find();
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
*/