const express = require('express');
const router = express.Router();
const {
  submitDegreeRequest,
  updateDegreeStatusAndGeneratePDF,
   getAllDegreeRequests,
   getDegreeRequestByStudentDID,
} = require('../controllers/degreeRequestController');

// Student submits a degree request
router.post('/', submitDegreeRequest);

// Admin updates status & generates PDF
router.post('/update-status', updateDegreeStatusAndGeneratePDF);

router.get('/', getAllDegreeRequests);
// Fetch one student's degree request by DID
router.get('/:studentDID', getDegreeRequestByStudentDID);

module.exports = router;


/*
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const DegreeRequest = require('../models/DegreeRequest');

// Student applies for degree
router.post('/apply', async (req, res) => {
  const { studentDID } = req.body;
  try {
    const existing = await DegreeRequest.findOne({ studentDID });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const request = new DegreeRequest({ studentDID });
    await request.save();
    res.json({ message: 'Degree request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin gets all degree requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await DegreeRequest.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates request status and attaches PDF path
router.post('/update-status', async (req, res) => {
  const { studentDID, status, remark, pdfContent } = req.body;
  try {
    let pdfPath = '';

    if (status === 'Approved' && pdfContent) {
      const filename = `${studentDID}.pdf`;

      const folderPath = path.join(__dirname, '..', 'degree_pdfs');
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const absolutePath = path.join(folderPath, filename);
      fs.writeFileSync(absolutePath, Buffer.from(pdfContent, 'base64'));

      // This relative path will be used for static serving
      pdfPath = `degree_pdfs/${filename}`;
    }

    const updated = await DegreeRequest.findOneAndUpdate(
      { studentDID },
      { status, remark, pdfPath, approvedAt: new Date() },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student fetches request status
router.get('/:did', async (req, res) => {
  try {
    const request = await DegreeRequest.findOne({ studentDID: req.params.did });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
*/

