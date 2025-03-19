const express = require('express');
const { addDegree, getDegree } = require('../controllers/degreeController');
const router = express.Router();

router.post('/issue', addDegree);
router.get('/:studentDID', getDegree);

module.exports = router;
