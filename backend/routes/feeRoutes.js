const express = require('express');
const { payFee, getFeePayments } = require('../controllers/feeController');
const router = express.Router();

router.post('/pay', payFee);
router.get('/:studentDID', getFeePayments);

module.exports = router;
