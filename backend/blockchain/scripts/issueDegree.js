require('dotenv').config();
const { web3, contract } = require('../utils/web3');
const uploadPDF = require('../utils/ipfsUpload');

async function issueDegree(studentAddress, pdfPath, issueDate) {
  const cid = await uploadPDF(pdfPath);

  const account = web3.eth.accounts.privateKeyToAccount(process.env.SEPOLIA_PRIVATE_KEY);
  const data = contract.methods.issueDegree(studentAddress, cid, issueDate).encodeABI();

  const tx = {
    from: account.address,
    to: contract.options.address,
    data,
    gas: 3000000,
  };

  const signedTx = await account.signTransaction(tx);
  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  console.log('Degree Issued! TX:', receipt.transactionHash);
  console.log('IPFS Link: https://ipfs.io/ipfs/' + cid);
}

issueDegree(
  '0xStudentAddressHere',
  './pdfs/sample-degree.pdf',
  '2025-05-21'
);
