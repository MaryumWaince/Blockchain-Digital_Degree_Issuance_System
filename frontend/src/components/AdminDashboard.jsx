import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [governorSignature, setGovernorSignature] = useState(null);
  const [vcSignature, setVcSignature] = useState(null);
  const [filter, setFilter] = useState({ degree: '', semester: '', did: '' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Fetch all student data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/students`);
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
    };
    fetchStudents();
  }, [backendUrl]);

  // Handle input filter changes
  const handleFilterChange = (e) => {
    setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit fee filter manually with semester parsed as number
  const handleFilterSubmit = async () => {
    try {
      const query = new URLSearchParams({
        ...filter,
        semester: filter.semester ? Number(filter.semester) : ''
      }).toString();

      const res = await axios.get(`${backendUrl}/api/fees/filter?${query}`);
      setFees(res.data);
    } catch (err) {
      console.error('Failed to fetch filtered fee data:', err);
    }
  };

  const handleIssueDegree = (did) => {
    alert(`Degree issued for DID: ${did}`);
    // Add backend logic for actual issuance if needed
  };

  const handleSignatureUpload = (e, role) => {
    const file = e.target.files[0];
    if (role === 'governor') setGovernorSignature(file);
    else setVcSignature(file);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Dashboard</h2>

      {/* Degree Issuance */}
      <h3>📜 Degree Issuance Overview</h3>
      {students.length === 0 ? (
        <p>No student records available.</p>
      ) : (
        students.map(student => (
          <div key={student.did} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <p><strong>DID:</strong> {student.did}</p>
            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>Degree:</strong> {student.degree}</p>
            <p><strong>Batch:</strong> {student.batch}</p>
            <button onClick={() => handleIssueDegree(student.did)}>Issue Degree</button>
          </div>
        ))
      )}

      {/* Fee Transactions */}
      <h3>💰 Fee Transactions</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>Degree:</label>
        <input type="text" name="degree" value={filter.degree} onChange={handleFilterChange} placeholder="BSCS" />

        <label style={{ marginLeft: '10px' }}>Semester:</label>
        <input type="text" name="semester" value={filter.semester} onChange={handleFilterChange} placeholder="1" />

        <label style={{ marginLeft: '10px' }}>DID:</label>
        <input type="text" name="did" value={filter.did} onChange={handleFilterChange} placeholder="abc123" />

        <button onClick={handleFilterSubmit} style={{ marginLeft: '10px' }}>Filter</button>
      </div>

      {fees.length === 0 ? (
        <p>No filtered fee data.</p>
      ) : (
        fees.map((fee, idx) => (
          <div key={idx} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
            <p><strong>DID:</strong> {fee.studentDID} | <strong>Semester:</strong> {fee.semester} | <strong>Status:</strong> {fee.status}</p>
          </div>
        ))
      )}

      {/* Signature Upload */}
      <h3>🖋️ Upload Official Signatures</h3>
      <div>
        <label>Governor Signature: </label>
        <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'governor')} />
        {governorSignature && <p>Uploaded: {governorSignature.name}</p>}
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>VC Signature: </label>
        <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'vc')} />
        {vcSignature && <p>Uploaded: {vcSignature.name}</p>}
      </div>
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