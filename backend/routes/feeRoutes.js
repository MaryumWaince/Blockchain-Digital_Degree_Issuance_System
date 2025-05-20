const express = require('express');
const router = express.Router();

const {
  payFee,
  getFeePayments,
  filterFees
} = require('../controllers/feeController');

// POST: Pay or update fee
router.post('/pay', payFee);

// GET: Filter fees (query params supported)
router.get('/filter', filterFees);

// GET: All fee records (optional route, direct DB query)
router.get('/all', async (req, res) => {
  const Fee = require('../models/Fee');
  try {
    const fees = await Fee.find({});
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all fee records', error: err.message });
  }
});

// GET: Fee records by student DID
router.get('/:studentDID', getFeePayments);

module.exports = router;
