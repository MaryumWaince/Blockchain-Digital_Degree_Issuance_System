const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  throw new Error('Pinata API keys are not set in environment variables');
}

/**
 * Uploads a local file (PDF or any format) to IPFS using Pinata
 * @param {string} filePath - Local path to the file
 * @returns {Promise<string>} - IPFS CID of the uploaded file
 */
const uploadPDFToIPFS = async (filePath) => {
  try {
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    const metadata = JSON.stringify({
      name: filePath.split('/').pop(),
    });
    data.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    data.append('pinataOptions', options);

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
      maxContentLength: Infinity,
      headers: {
        ...data.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    return res.data.IpfsHash; // IPFS CID
  } catch (error) {
    console.error('Error uploading to IPFS via Pinata:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = uploadPDFToIPFS;
