const ReEnrollment = require('../models/ReEnrollment');

// Student submits re-enrollment request
exports.submitRequest = async (req, res) => {
  try {
    const { studentDID, semester, reason, courses } = req.body;

    if (!studentDID || !semester || !reason || !courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: 'Missing required fields or invalid format.' });
    }

    const formattedCourses = courses.map(course => ({
      courseName: course.courseName.trim()
    }));

    const request = new ReEnrollment({
      studentDID: studentDID.trim(),
      semester,
      reason: reason.trim(),
      courses: formattedCourses
    });

    await request.save();
    res.status(201).json({ message: 'Re-enrollment request submitted successfully.', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// HOD/Admin gets all re-enrollment requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ReEnrollment.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// HOD updates approval status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid or missing status. Must be "Approved" or "Rejected".' });
    }

    const statusFormatted = status.toLowerCase() === 'approved' ? 'Approved' : 'Rejected';
    const approvedByHOD = statusFormatted === 'Approved';

    const updated = await ReEnrollment.findByIdAndUpdate(
      id,
      { status: statusFormatted, approvedByHOD },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Re-enrollment request not found.' });
    }

    res.json({ message: 'Status updated successfully.', updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Faculty gets approved re-enrollment requests only
exports.getApprovedCourses = async (req, res) => {
  try {
    const approvedRequests = await ReEnrollment.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.json(approvedRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student fetches their re-enrollment requests
exports.getRequestsByStudentDID = async (req, res) => {
  try {
    const { did } = req.params;
    const requests = await ReEnrollment.find({ studentDID: did }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching re-enrollment requests.' });
  }
};
