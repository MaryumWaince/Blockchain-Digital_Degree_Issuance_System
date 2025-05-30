const express = require('express');
const multer = require('multer');
const path = require('path');
const Signature = require('../models/Signature');
const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/signatures/'),
  filename: (req, file, cb) =>
    cb(null, `vc_signature_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ✅ POST: Upload VC Signature
router.post('/vc', upload.single('signature'), async (req, res) => {
  try {
    const filePath = req.file.path;

    await Signature.findOneAndUpdate(
      { role: 'VC' },
      { imagePath: filePath },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'Signature uploaded successfully',
      path: filePath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload signature' });
  }
});

// ✅ GET: Fetch VC Signature
router.get('/vc', async (req, res) => {
  try {
    const signature = await Signature.findOne({ role: 'VC' });
    if (!signature || !signature.imagePath) {
      return res.status(404).json({ message: 'VC Signature not found' });
    }

    // Serve image URL based on backend host
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullImageUrl = `${baseUrl}/${signature.imagePath}`;

    res.status(200).json({ imageUrl: fullImageUrl });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch signature' });
  }
});

module.exports = router;

