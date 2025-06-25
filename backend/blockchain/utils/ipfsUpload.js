// ipfsUpload.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

// Load environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

/**
 * Upload file to IPFS via Pinata
 * @param {string} filePath - Path to the local file
 * @returns {Promise<string>} - CID (IPFS hash)
 */
async function uploadToIPFS(filePath) {
  try {
    // Check API keys
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error('❌ Pinata API keys are not set in environment variables');
    }

    // Check file existence
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ File not found: ${filePath}`);
    }

    // Prepare FormData
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    // Optional metadata
    const metadata = JSON.stringify({
      name: filePath.split('/').pop(),
    });
    data.append('pinataMetadata', metadata);

    // Optional options (CID version)
    const options = JSON.stringify({
      cidVersion: 1,
    });
    data.append('pinataOptions', options);

    // Send request to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        maxContentLength: Infinity,
        headers: {
          ...data.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    const cid = response.data.IpfsHash;
    console.log('✅ Uploaded to IPFS via Pinata');
    console.log('📦 CID:', cid);
    console.log(`🔗 URL: https://gateway.pinata.cloud/ipfs/${cid}`);
    return cid;

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

module.exports = { uploadToIPFS };
