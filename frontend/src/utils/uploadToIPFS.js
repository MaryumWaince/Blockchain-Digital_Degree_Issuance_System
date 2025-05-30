import axios from 'axios';

export async function uploadPDF(file) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const data = new FormData();
  data.append('file', file);

  try {
    const res = await axios.post(url, data, {
      maxContentLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data`,
        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
      },
    });

    return res.data.IpfsHash; // CID
  } catch (err) {
    console.error('Pinata upload failed:', err);
    throw new Error('IPFS upload failed');
  }
}
