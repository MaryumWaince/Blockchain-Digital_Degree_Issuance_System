
/*
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SignatureUpload from '../components/SignatureUpload';
import DegreeCertificate from '../components/DegreeCertificate';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [requests, setRequests] = useState([]); // will be set as array always
  const [filter, setFilter] = useState({ degree: '', semester: '', did: '' });
  const [selectedDID, setSelectedDID] = useState(null);
  const [degreeData, setDegreeData] = useState(null); // NEW: store fetched degree data
  const [stats, setStats] = useState({ registered: 0, passout: 0 });
  const [visibleSection, setVisibleSection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [degreeHashes, setDegreeHashes] = useState({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchStudents(), fetchRequests(), fetchStats()]);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/students`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch students:', err);
    }
  };

  const fetchRequests = async () => {
  try {
    const res = await axios.get('/api/degree-request');
    setRequests(res.data.requests);

    // Fetch hashes for each student DID
    const hashes = {};
    for (const req of res.data.requests) {
      try {
        const hashRes = await axios.get(`/api/degree-request/hash/${req.studentDID}`);
        hashes[req.studentDID] = hashRes.data.degreeHash;
      } catch (hashError) {
        console.error(`Failed to fetch hash for ${req.studentDID}`, hashError);
        hashes[req.studentDID] = null;
      }
    }
    console.log("Degree Hashes fetched:", hashes);  // <<<< Add this
    setDegreeHashes(hashes);
  } catch (error) {
    console.error("Error fetching degree requests:", error);
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

  const getStudentStatus = (studentDID) => {
    const req = requests.find(r => r.studentDID === studentDID);
    return req ? req.status : 'Not Requested';
  };

  const getDegreeHash = async (studentDID) => {
    try {
      const res = await axios.get(`${backendUrl}/api/degree-request/hash/${studentDID}`);
      setDegreeHashes(prev => ({ ...prev, [studentDID]: res.data.hash }));
    } catch (err) {
      setDegreeHashes(prev => ({ ...prev, [studentDID]: null }));
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
      await fetchRequests();
      setDegreeData(null); // reset degree data on update
      setSelectedDID(null);
    } catch (err) {
      alert('❌ Error updating request');
      console.error(err);
    }
  };

  const storeHash = async (studentDID, blockchainHash) => {
  setActionLoading(true);
  try {
    const res = await axios.post(`${backendUrl}/api/degree/store-hash`, {
      studentDID,
      blockchainHash,  // <-- include the actual hash here
    });
    alert(res.data.message);
    await fetchRequests();
    await getDegreeHash(studentDID);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to store hash on blockchain.');
  } finally {
    setActionLoading(false);
  }
};


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filter.degree) queryParams.append('degree', filter.degree);
      if (filter.semester) queryParams.append('semester', filter.semester);
      if (filter.did) queryParams.append('did', filter.did);

      const res = await axios.get(`${backendUrl}/api/fees/filter?${queryParams.toString()}`);
      setFees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch filtered fee data:', err);
    }
  };

  // NEW: fetch degree data for selected student DID
  const fetchDegreeData = async (studentDID) => {
    try {
      const response = await fetch(`${backendUrl}/api/degree/issued/${studentDID}`);
      if (!response.ok) {
        throw new Error('Degree not found or server error');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching degree data:', error);
      return null;
    }
  };

  // NEW: handle preview toggle and fetch degree data
  const handlePreviewToggle = async (studentDID) => {
    if (selectedDID === studentDID) {
      setSelectedDID(null);
      setDegreeData(null);
    } else {
      setSelectedDID(studentDID);
      const degree = await fetchDegreeData(studentDID);
      setDegreeData(degree);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>📋 Admin Dashboard</h1>

      <div className="dashboard-stats">
        <StatCard title="🎓 Registered Students (This Year)" value={stats.registered} />
        <StatCard title="✅ Degrees Issued (This Year)" value={stats.passout} />
      </div>

      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'requests' ? null : 'requests')}>
          📩 Degree Issuance Requests
        </h2>
        {visibleSection === 'requests' && (
          requests.length === 0 ? (
            <p>No degree requests found.</p>
          ) : (
            requests.map(req => {
              const status = getStudentStatus(req.studentDID);
              const hash = degreeHashes[req.studentDID];

              return (
                <RequestCard
                  key={req.studentDID}
                  request={req}
                  selectedDID={selectedDID}
                  onPreviewToggle={() => handlePreviewToggle(req.studentDID)} // UPDATED here
                  onApprove={() => updateRequest(req.studentDID, 'Approved')}
                  onReject={() => {
                    const remark = prompt('Enter reason for rejection:');
                    if (remark) updateRequest(req.studentDID, 'Rejected', remark);
                  }}
                  storeHash={storeHash}
                  actionLoading={actionLoading}
                  degreeHash={hash}
                  refreshHash={() => getDegreeHash(req.studentDID)}
                  status={status}
                />
              );
            })
          )
        )}
      </section>

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

      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'signatures' ? null : 'signatures')}>
          🖋️ Signature Upload
        </h2>
        {visibleSection === 'signatures' && <SignatureUpload />}
      </section>

      // Show degree certificate when a request is selected 
      {selectedDID && degreeData && (
        <section className="section degree-preview">
          <h2>Degree Certificate Preview - {selectedDID}</h2>
          <DegreeCertificate data={degreeData} />
        </section>
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <p>{value}</p>
  </div>
);

const RequestCard = ({
  request,
  selectedDID,
  onPreviewToggle,
  onApprove,
  onReject,
  storeHash,
  actionLoading,
  degreeHash,
  refreshHash,
  status,
}) => {
  const isSelected = selectedDID === request.studentDID;

  return (
    <div className={`request-card ${isSelected ? 'selected' : ''}`}>
      <div className="request-header" onClick={onPreviewToggle}>
        <h3>Student DID: {request.studentDID}</h3>
        <p>Status: {status}</p>
      </div>

      {isSelected && (
        <div className="request-details">
          <p>Degree: {request.degree}</p>
          <p>Semester: {request.semester}</p>
          <p>Remark: {request.remark || 'N/A'}</p>

          <div className="request-actions">
            <button disabled={actionLoading} onClick={onApprove}>Approve</button>
            <button disabled={actionLoading} onClick={onReject}>Reject</button>
            <button disabled={actionLoading} onClick={() => storeHash(request.studentDID)}>Store Hash on Blockchain</button>
            <button onClick={refreshHash}>Refresh Hash</button>
          </div>

          <div className="degree-hash">
            <strong>Degree Hash:</strong> {degreeHash || 'Not stored'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
*/

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
  const [visibleSection, setVisibleSection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [degreeHashes, setDegreeHashes] = useState({});
  const [batchStats, setBatchStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
useEffect(() => {
  // Fetch dashboard data on mount (only once)
  fetchDashboardData();
}, []); // empty dependency to run once on mount

useEffect(() => {
  // Fetch batch stats ONLY when batchStats section is visible
  if (visibleSection === 'batchStats') {
    const fetchBatchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/batch-stats');
        const data = await response.json();
        console.log('Batch Stats API Response:', data);
        setBatchStats(data);
      } catch (error) {
        console.error("Failed to fetch batch stats:", error);
        setBatchStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBatchStats();
  }
}, [visibleSection]);

  const fetchDashboardData = async () => {
    await Promise.all([fetchStudents(), fetchRequests()]);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/students`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch students:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/degree-request`);
      const requestsArray = res.data.data;
      setRequests(requestsArray);
      requestsArray.forEach(r => getDegreeHash(r.studentDID));
    } catch (err) {
      console.error('❌ Failed to fetch degree requests:', err);
    }
  };

  const getStudentStatus = (studentDID) => {
    const req = requests.find(r => r.studentDID === studentDID);
    return req ? req.status : 'Not Requested';
  };

  const getDegreeHash = async (studentDID) => {
    try {
      const res = await axios.get(`${backendUrl}/api/degree-request/hash/${studentDID}`);
      setDegreeHashes(prev => ({ ...prev, [studentDID]: res.data.hash }));
    } catch (err) {
      setDegreeHashes(prev => ({ ...prev, [studentDID]: null }));
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
      await fetchRequests();
    } catch (err) {
      alert('❌ Error updating request');
      console.error(err);
    }
  };

  const storeHash = async (studentDID, txHash) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/degree/store-hash`, {
        studentDID,
        blockchainHash: txHash
      });
      alert(res.data.message);
      await fetchRequests();
      await getDegreeHash(studentDID);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to store hash on blockchain.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filter.degree) queryParams.append('degree', filter.degree);
      if (filter.semester) queryParams.append('semester', filter.semester);
      if (filter.did) queryParams.append('did', filter.did);

      const res = await axios.get(`${backendUrl}/api/fees/filter?${queryParams.toString()}`);
      setFees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch filtered fee data:', err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>📋 Admin Dashboard</h1>

      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'requests' ? null : 'requests')}>
          📩 Degree Issuance Requests
        </h2>
        {visibleSection === 'requests' && (
          requests.length === 0 ? (
            <p>No degree requests found.</p>
          ) : (
            requests.map(req => {
              const status = getStudentStatus(req.studentDID);
              const hash = degreeHashes[req.studentDID];
              return (
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
                  degreeHash={hash}
                  refreshHash={() => getDegreeHash(req.studentDID)}
                  status={status}
                />
              );
            })
          )
        )}
      </section>

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

      <section className="section">
        <h2 onClick={() => setVisibleSection(prev => prev === 'signature' ? null : 'signature')}>
          🖋️ Upload VC Signature
        </h2>
        {visibleSection === 'signature' && <SignatureUpload />}
      </section>

     <section className="section">
      <h2
        style={{ cursor: 'pointer' }}
        onClick={() => setVisibleSection(prev => prev === 'batchStats' ? null : 'batchStats')}
      >
        📊 Batch-wise Statistics
      </h2>

      {visibleSection === 'batchStats' && (
        loading ? (
          <p>Loading batch statistics...</p>
        ) : !batchStats || Object.keys(batchStats).length === 0 ? (
          <p>No stats available.</p>
        ) : (
          <table className="fee-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Registered Students</th>
                <th>Degrees Issued</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(batchStats).map(([batch, stat]) => (
                <tr key={batch}>
                  <td>{batch}</td>
                  <td>{stat.registered ?? 0}</td>
                  <td>{stat.issued ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </section>
    </div>
  );
};

const RequestCard = ({
  request,
  selectedDID,
  onPreviewToggle,
  onApprove,
  onReject,
  storeHash,
  actionLoading,
  degreeHash,
  refreshHash,
  status
}) => (
  <div className="card">
    <p><strong>DID:</strong> {request.studentDID}</p>
    <p><strong>Status:</strong> {status}</p>

    {request.status === 'Rejected' && request.remark && (
      <p className="remark">❌ Remark: {request.remark}</p>
    )}

    {request.status === 'Pending' && (
      <>
        <button onClick={onApprove} disabled={actionLoading}>Approve</button>
        <button onClick={onReject} disabled={actionLoading}>Reject</button>
      </>
    )}

    <button onClick={onPreviewToggle}>
      {selectedDID === request.studentDID ? 'Hide' : 'Show'} Degree Preview
    </button>

    {selectedDID === request.studentDID && (
      <DegreeCertificate studentDID={request.studentDID} />
    )}

    {degreeHash ? (
      <p><strong>Blockchain Hash:</strong> {degreeHash}</p>
    ) : (
      <p>Hash not stored on blockchain yet.</p>
    )}

    <button onClick={() => {
      const txHash = prompt("Enter Blockchain Transaction Hash:");
      if (txHash) storeHash(request.studentDID, txHash);
    }} disabled={actionLoading}>
      Store Hash on Blockchain
    </button>

    <button onClick={refreshHash} disabled={actionLoading}>
      Refresh Hash
    </button>
  </div>
);

export default AdminDashboard;
