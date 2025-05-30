import React, { useState } from 'react';
import axios from 'axios';
import web3 from '../utils/web3';
import contractABI from '../utils/contractABI.json';

const DegreeUploader = () => {
  const [studentDID, setStudentDID] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentDID || !issueDate) {
      alert("Student DID and Issue Date are required");
      return;
    }

    try {
      setStatus("⏳ Requesting PDF generation & IPFS upload from backend...");

      // 1. Call backend API to generate PDF + upload to IPFS
      const response = await axios.post('http://localhost:5000/api/degrees/generate-and-upload', {
        studentDID: studentDID.trim(),
        issueDate,
      });

      const { cid } = response.data;
      const pdfURL = `https://ipfs.io/ipfs/${cid}`;
      setStatus(`📡 PDF uploaded to IPFS with CID: ${cid}\n🔄 Sending transaction to blockchain...`);

      // 2. Interact with smart contract to store IPFS hash on-chain
      const contract = new web3.eth.Contract(
        contractABI,
        process.env.REACT_APP_CONTRACT_ADDRESS
      );

      const data = contract.methods.issueDegree(studentDID.trim(), cid, issueDate).encodeABI();

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: process.env.REACT_APP_CONTRACT_ADDRESS,
          data,
          gas: 3000000,
        },
        process.env.REACT_APP_PRIVATE_KEY
      );

      setStatus("⏳ Sending transaction to Sepolia...");

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      const txHash = receipt.transactionHash;

      setStatus(
        `✅ Degree Issued Successfully!\n\n📄 PDF on IPFS: ${pdfURL}\n🔗 View Tx: https://sepolia.etherscan.io/tx/${txHash}`
      );
    } catch (err) {
      console.error(err);
      setStatus("❌ Error issuing degree. Check console for details.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-semibold">🎓 Issue Degree</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Student DID"
          value={studentDID}
          onChange={(e) => setStudentDID(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Issue Degree
        </button>
      </form>
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{status}</pre>
    </div>
  );
};

export default DegreeUploader;
