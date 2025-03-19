import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [studentDID, setStudentDID] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [cgpa, setCGPA] = useState('');
  const [blockchainHash, setBlockchainHash] = useState('');

  const issueDegree = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/degrees/issue`, {
        studentDID, degreeName, cgpa, blockchainHash
      });
      alert('Degree Issued Successfully');
    } catch (error) {
      alert('Failed to Issue Degree');
    }
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <h2>Issue Degree</h2>
      <input placeholder="Student DID" value={studentDID} onChange={(e) => setStudentDID(e.target.value)} />
      <input placeholder="Degree Name" value={degreeName} onChange={(e) => setDegreeName(e.target.value)} />
      <input placeholder="CGPA" value={cgpa} onChange={(e) => setCGPA(e.target.value)} />
      <input placeholder="Blockchain Hash" value={blockchainHash} onChange={(e) => setBlockchainHash(e.target.value)} />
      <button onClick={issueDegree}>Issue Degree</button>
    </div>
  );
};

export default AdminDashboard;
