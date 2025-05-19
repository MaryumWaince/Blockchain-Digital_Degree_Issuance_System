const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Fingerprint = require('../models/Fingerprint');

router.post('/register', async (req, res) => {
  const { did, fingerprintData } = req.body;
  if (!did || !fingerprintData) return res.status(400).json({ message: 'DID and fingerprint required' });

  try {
    const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');
    const saved = await Fingerprint.findOneAndUpdate(
      { did },
      { hash },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Fingerprint registered', data: saved });
  } catch (err) {
    res.status(500).json({ message: 'Error saving fingerprint', error: err.message });
  }
});
