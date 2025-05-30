require('dotenv').config();
const { contract } = require('../utils/web3');

async function getDegree(studentAddress) {
  const [cid, date, issued] = await contract.methods.getDegree(studentAddress).call();
  console.log(`CID: ${cid}`);
  console.log(`Issued On: ${date}`);
  console.log(`Status: ${issued ? "Issued" : "Not Issued"}`);
  console.log(`IPFS Link: https://ipfs.io/ipfs/${cid}`);
}

getDegree('0xStudentAddressHere');
