const FacultyAdmin = require('../models/FacultyAdmin');

// Register Faculty or Admin
const registerUser = async (req, res) => {
  try {
    const { name, cnic, userType } = req.body;

    // Check if userType is valid
    if (userType !== 'Faculty' && userType !== 'Admin') {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Check if user already exists
    const existingUser = await FacultyAdmin.findOne({ cnic, userType });
    if (existingUser) {
      return res.status(400).json({ message: `${userType} already registered with this CNIC` });
    }

    const user = new FacultyAdmin({ name, cnic, userType });
    await user.save();

    res.status(201).json({ message: `${userType} registered successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login Faculty or Admin
const loginUser = async (req, res) => {
  try {
    const { cnic, userType } = req.body;

    if (!cnic || !userType) {
      return res.status(400).json({ message: 'CNIC and User Type are required' });
    }

    const user = await FacultyAdmin.findOne({ cnic, userType });

    if (!user) {
      return res.status(404).json({ message: 'User not found or wrong user type' });
    }

    res.status(200).json({ message: `${userType} Login Successful`, userType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
