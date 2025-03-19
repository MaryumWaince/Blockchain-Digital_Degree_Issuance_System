const Degree = require('../models/Degree');

// Add a degree record (After passing all requirements)
const addDegree = async (req, res) => {
  try {
    const { studentDID, studentName, studentEmail, degreeName, cgpa, blockchainHash } = req.body;
    const newDegree = new Degree({
      studentDID,
      studentName,
      studentEmail,
      degreeName,
      cgpa,
      blockchainHash,
      status: 'Issued'
    });

    await newDegree.save();
    res.status(201).json({ message: 'Degree Issued Successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get degree by student DID
const getDegree = async (req, res) => {
  try {
    const { studentDID } = req.params;
    const degree = await Degree.findOne({ studentDID });

    if (!degree) {
      return res.status(404).json({ message: 'Degree not found' });
    }
    res.status(200).json(degree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addDegree, getDegree };
