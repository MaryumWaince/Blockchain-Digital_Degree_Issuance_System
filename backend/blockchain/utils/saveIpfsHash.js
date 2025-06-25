const Degree = require('../../models/Degree');
const IpfsRecord = require('../../models/IpfsRecord');

/**
 * Save IPFS hash and related PDF info to MongoDB.
 * - Assumes PDF is already generated and uploaded to IPFS.
 */
async function saveIPFSHashToMongo({
  studentDID,
  studentName,
  studentEmail,
  degree,
  cgpa,
  ipfsHash,
  pdfUrl,
  pdfPath,
  qrCodeUrl
}) {
  try {
    if (!studentDID || !ipfsHash) {
      throw new Error('Missing studentDID or ipfsHash while logging to IpfsRecord');
    }

    const updatedDegree = await Degree.findOneAndUpdate(
      { studentDID, degree },
      {
        studentName,
        studentEmail,
        degree,
        cgpa,
        status: 'Pending',
        blockchainHash: ipfsHash,
        pdfGenerated: true,
        pdfUrl,
        pdfPath,
        qrCodeUrl
      },
      { upsert: true, new: true }
    );

    if (!updatedDegree) {
      throw new Error('Failed to update Degree document with IPFS hash');
    }

    console.log('✅ IPFS hash and PDF info saved to Degree model');

    const record = new IpfsRecord({
      studentDID,
      degree,
      ipfsHash,
      timestamp: new Date()
    });

    await record.save();
    console.log('🕒 IPFS hash logged to IpfsRecord model');

  } catch (error) {
    console.error('❌ Error saving IPFS hash to MongoDB:', error.message);
    throw error;
  }
}


/**
 * Save blockchain TX hash (after degree issuance) to Degree model.
 */
async function saveBlockchainHashToMongo(studentDID, degree, blockchainTxHash) {
  try {
    const result = await Degree.findOneAndUpdate(
      { studentDID, degree },
      { txHash: blockchainTxHash },
      { upsert: false, new: true }
    );

    if (!result) {
      throw new Error('No Degree document found to update txHash');
    }

    console.log('✅ Blockchain txHash saved to Degree model');
  } catch (error) {
    console.error('❌ Error saving blockchain txHash:', error.message);
    throw error;
  }
}

module.exports = {
  saveIPFSHashToMongo,
  saveBlockchainHashToMongo
};

