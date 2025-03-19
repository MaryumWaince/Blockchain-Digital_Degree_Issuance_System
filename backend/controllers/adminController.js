const Degree = require('../models/Degree');

// View Degree Request
const viewDegree = async (req, res) => {
  try {
    const { studentDID } = req.params;
    const degree = await Degree.findOne({ studentDID });

    if (!degree) return res.status(404).json({ message: 'Degree not found' });

    res.status(200).json(degree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve or Reject Degree
const processDegree = async (req, res) => {
  try {
    const { studentDID, status, remark, viceChancellor, governor } = req.body;

    const degree = await Degree.findOne({ studentDID });
    if (!degree) return res.status(404).json({ message: 'Degree not found' });

    degree.status = status;

    if (status === 'Rejected') {
      degree.remark = remark;
      degree.viceChancellor = viceChancellor;
      degree.governor = governor;
    }

    await degree.save();
    res.status(200).json({ message: 'Degree processed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { viewDegree, processDegree };
