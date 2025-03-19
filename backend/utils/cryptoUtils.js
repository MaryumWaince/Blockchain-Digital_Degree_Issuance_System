const crypto = require('crypto');

const generateDID = (name, cnic) => {
  return crypto.createHash('sha256').update(name + cnic).digest('hex');
};

const encryptData = (data) => {
  const cipher = crypto.createCipher('aes-256-ctr', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const generatePrivateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateDID, encryptData, generatePrivateKey };
