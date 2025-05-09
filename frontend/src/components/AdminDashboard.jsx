// File: src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch('/api/admin/degree-status')
      .then(res => res.json())
      .then(setRecords);
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {records.map(r => (
        <div key={r.did} style={{ border: '1px solid #ccc', marginBottom: '10px' }}>
          <p>DID: {r.did}</p>
          <p>Degree Status: {r.degreeStatus}</p>
          <p>Fee Confirmed: {r.feeConfirmed ? 'Yes' : 'No'}</p>
          <p>VC Signature: {r.vcSignature}</p>
          <p>Governor Signature: {r.governorSignature}</p>
          <p>Remarks: {r.remark}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;


/*
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

*/