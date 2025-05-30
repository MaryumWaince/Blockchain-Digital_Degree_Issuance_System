// AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SignatureUpload from '../components/SignatureUpload';
import DegreeCertificate from '../components/DegreeCertificate';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState({ degree: '', semester: '', did: '' });
  const [selectedDID, setSelectedDID] = useState(null);
  const [stats, setStats] = useState({ registered: 0, passout: 0 });
  const [visibleSection, setVisibleSection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetch('http://localhost:5000/api/degree-request')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
        } else if (Array.isArray(data.data)) {
          setRequests(data.data);
        } else {
          setRequests([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching degree requests:", err);
        setRequests([]);
      });
  }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchStudents(), fetchRequests(), fetchStats()]);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/students`);
      setStudents(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch students:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/degree-request`);
      setRequests(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch degree requests:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const [studentsRes, degreesRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students`),
        axios.get(`${backendUrl}/api/degrees`)
      ]);

      const registeredThisYear = studentsRes.data.filter(s => {
        const createdAt = new Date(s.createdAt || parseInt(s._id?.substring(0, 8), 16) * 1000);
        return createdAt.getFullYear() === currentYear;
      });

      const passedThisYear = degreesRes.data.filter(d => {
        const issuedDate = new Date(d.issuedOn);
        return issuedDate.getFullYear() === currentYear && d.status === 'Issued';
      });

      setStats({
        registered: registeredThisYear.length,
        passout: passedThisYear.length
      });
    } catch (err) {
      console.error('❌ Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async () => {
    try {
      const query = new URLSearchParams({
        ...filter,
        semester: filter.semester ? Number(filter.semester) : ''
      }).toString();

      const res = await axios.get(`${backendUrl}/api/fees/filter?${query}`);
      setFees(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch filtered fee data:', err);
    }
  };

  const updateRequest = async (studentDID, status, remark = '') => {
    try {
      const payload = {
        studentDID,
        status,
        remark,
        pdfPath: status === 'Approved' ? `degree_pdfs/${studentDID}.pdf` : ''
      };

      await axios.post(`${backendUrl}/api/degree-request/update-status`, payload);
      alert(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      alert('❌ Error updating request');
      console.error(err);
    }
  };

  const storeHash = async (studentDID) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/degree/store-hash`, { studentDID });
      alert(res.data.message);
      fetchRequests(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to store hash on blockchain.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>📋 Admin Dashboard</h1>

      {/* Stats Section */}
      <div className="dashboard-stats">
        <StatCard title="🎓 Registered Students (This Year)" value={stats.registered} />
        <StatCard title="✅ Degrees Issued (This Year)" value={stats.passout} />
      </div>

      {/* Requests Section */}
      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'requests' ? null : 'requests')}>
          📩 Degree Issuance Requests
        </h2>
        {visibleSection === 'requests' && (
          requests.length === 0 ? (
            <p>No degree requests found.</p>
          ) : (
            requests.map(req => (
              <RequestCard
                key={req.studentDID}
                request={req}
                selectedDID={selectedDID}
                onPreviewToggle={() => setSelectedDID(prev => prev === req.studentDID ? null : req.studentDID)}
                onApprove={() => updateRequest(req.studentDID, 'Approved')}
                onReject={() => {
                  const remark = prompt('Enter reason for rejection:');
                  if (remark) updateRequest(req.studentDID, 'Rejected', remark);
                }}
                storeHash={storeHash}
                actionLoading={actionLoading}
              />
            ))
          )
        )}
      </section>

      {/* Fee Section */}
      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'fees' ? null : 'fees')}>
          💰 Fee Transactions
        </h2>
        {visibleSection === 'fees' && (
          <>
            <div className="filter-bar">
              <input type="text" name="degree" placeholder="Degree" value={filter.degree} onChange={handleFilterChange} />
              <input type="text" name="semester" placeholder="Semester" value={filter.semester} onChange={handleFilterChange} />
              <input type="text" name="did" placeholder="Student DID" value={filter.did} onChange={handleFilterChange} />
              <button onClick={handleFilterSubmit}>Filter</button>
            </div>
            {fees.length === 0 ? (
              <p>No filtered fee data.</p>
            ) : (
              <table className="fee-table">
                <thead>
                  <tr>
                    <th>Student DID</th>
                    <th>Semester</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, idx) => (
                    <tr key={idx}>
                      <td>{fee.studentDID}</td>
                      <td>{fee.semester}</td>
                      <td>{fee.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* Signature Upload */}
      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'signature' ? null : 'signature')}>
          🖋️ Upload VC Signature
        </h2>
        {visibleSection === 'signature' && <SignatureUpload />}
      </section>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <p>{value}</p>
  </div>
);

const RequestCard = ({ request, selectedDID, onPreviewToggle, onApprove, onReject, storeHash, actionLoading }) => (
  <div className="card">
    <p><strong>DID:</strong> {request.studentDID}</p>
    <p><strong>Status:</strong> {request.status}</p>

    {request.status === 'Pending' && (
      <>
        <button className="approve-btn" onClick={onApprove}>Approve</button>
        <button className="reject-btn" onClick={onReject}>Reject</button>
      </>
    )}

    {request.status === 'Rejected' && request.remark && (
      <p className="remark">❌ Remark: {request.remark}</p>
    )}

    {request.status === 'Approved' && !request.blockchainHash && (
      <button onClick={() => storeHash(request.studentDID)} disabled={actionLoading}>
        {actionLoading ? 'Processing...' : 'Store Hash on Blockchain'}
      </button>
    )}

    {request.blockchainHash && (
      <span title={`Hash: ${request.blockchainHash}`}>
        ✅ Verified on Blockchain
      </span>
    )}

    <button className="preview-btn" onClick={onPreviewToggle}>
      {selectedDID === request.studentDID ? 'Hide Certificate' : 'Preview Certificate'}
    </button>

    {selectedDID === request.studentDID && (
      <div className="preview-container">
        <DegreeCertificate studentDID={request.studentDID} />
      </div>
    )}
  </div>
);

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