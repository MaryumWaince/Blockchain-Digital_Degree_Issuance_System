const path = require('path');
const web3Path = path.resolve(__dirname, '../blockchain/utils/web3.js');
const { web3, contract, account } = require(web3Path);

// ✅ Issue a degree — this is the only write function needed
async function issueDegree(studentDID, pdfCID, issuedOn) {
  try {
    const issuedOnStr = issuedOn.toString();

    // 🔍 Step 1: Check if the degree already exists
    const result = await contract.methods.getDegreeInfo(studentDID).call();
    const { issued, rejected } = result.degree;

    if (issued && !rejected) {
      throw new Error(`Degree already issued and not rejected.`);
    }

    // ✅ Step 2: Estimate gas
    const gasEstimate = await contract.methods
      .issueDegree(studentDID, pdfCID, issuedOnStr)
      .estimateGas({ from: account.address });

    const gasLimit = Number(BigInt(gasEstimate) + BigInt(10000));

    // 🚀 Step 3: Issue degree
    const tx = await contract.methods
      .issueDegree(studentDID, pdfCID, issuedOnStr)
      .send({ from: account.address, gas: gasLimit });
 

    console.log('Degree issued in tx:', tx.transactionHash);
    return tx;
  } catch (error) {
    console.error('Error in issueDegree:', error);
    if (error && error.data) {
      console.error('Error data:', error.data);
    }
    throw error;
  }
}


// ✅ Retain this for verification / comparison purposes
async function getDegreeHash(studentDID) {
  try {
    const hash = await contract.methods.getDegreeHash(studentDID).call();
    return hash;
  } catch (error) {
    console.error('Error in getDegreeHash:', error);
    throw error;
  }
}

// ❌ REMOVE storeDegreeHash because it's not in the smart contract

module.exports = {
  issueDegree,
  getDegreeHash,
};
