const mongoose = require('mongoose');

const ipfsRecordSchema = new mongoose.Schema({
  studentDID: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  ipfsHash: {
    type: String,
    required: true,
  },
 
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('IpfsRecord', ipfsRecordSchema);
