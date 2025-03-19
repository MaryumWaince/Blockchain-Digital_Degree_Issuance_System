const Fee = require('../models/Fee');

// Record a fee payment
const payFee = async (req, res) => {
  try {
    const { studentDID, amount, semester, transactionHash } = req.body;

    const newFee = new Fee({
      studentDID,
      amount,
      semester,
      status: 'Paid',
      transactionHash
    });

    await newFee.save();
    res.status(201).json({ message: 'Fee Payment Recorded Successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch all fee payments for a specific student
const getFeePayments = async (req, res) => {
  try {
    const { studentDID } = req.params;
    const payments = await Fee.find({ studentDID });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { payFee, getFeePayments };
