// routes/facultyAdminRoutes.js

const express = require('express');
const router = express.Router();

// Dummy login route for demonstration
router.post('/login', (req, res) => {
  const { userType, username, password } = req.body;

  if (!username || !password || !userType) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  // For now, just a dummy response
  if (userType === 'Faculty' || userType === 'Admin') {
    return res.status(200).json({ message: `${userType} login successful.` });
  } else {
    return res.status(401).json({ message: 'Invalid user type.' });
  }
});

module.exports = router;

