const express = require('express');
const { viewDegree, processDegree } = require('../controllers/adminController');
const router = express.Router();

router.get('/:studentDID', viewDegree);
router.post('/process-degree', processDegree);

module.exports = router;
