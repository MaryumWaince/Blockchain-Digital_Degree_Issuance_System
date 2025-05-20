import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HODScheduleDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [reEnrollments, setReEnrollments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLeavesAndSchedule = async () => {
      try {
        const [leaveRes, scheduleRes] = await Promise.all([
          fetch(`${baseURL}/api/leaves/all`),
          fetch(`${baseURL}/api/schedule/all`),
        ]);
        const [leaveData, scheduleData] = await Promise.all([
          leaveRes.json(),
          scheduleRes.json(),
        ]);
        setLeaves(leaveData);
        setScheduleRequests(scheduleData);
      } catch (err) {
        console.error('Error loading leaves or schedule requests:', err);
        setMessage('Failed to load leave or schedule requests.');
      }
    };

    const fetchReEnrollments = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/reenrollment`);
        setReEnrollments(res.data);
      } catch (error) {
        console.error('Error fetching re-enrollment data:', error);
        setMessage('Failed to load re-enrollment requests.');
      }
    };

    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchLeavesAndSchedule(), fetchReEnrollments()]);
      setLoading(false);
    };

    fetchAll();
  }, [baseURL]);

  const approveLeave = async (id) => {
    try {
      const res = await fetch(`${baseURL}/api/leaves/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setLeaves(prev => prev.map(l => (l._id === id ? { ...l, approved: true } : l)));
        alert('Leave approved.');
      } else {
        alert('Failed to approve leave.');
      }
    } catch {
      alert('Error approving leave.');
    }
  };

  const approveSchedule = async (id) => {
    try {
      const res = await fetch(`${baseURL}/api/schedule/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setScheduleRequests(prev => prev.map(r => (r._id === id ? { ...r, approved: true } : r)));
        alert('Schedule approved.');
      } else {
        alert('Failed to approve schedule.');
      }
    } catch {
      alert('Error approving schedule.');
    }
  };

const handleReEnrollmentAction = async (id, status) => {
  try {
    const result = await axios.patch(`${baseURL}/api/reenrollment/${id}/status`, { status });
    console.log('Update result:', result.data);
    setMessage(`Re-enrollment ${status} successfully.`);
    const res = await axios.get(`${baseURL}/api/reenrollment`);
    setReEnrollments(res.data);
  } catch (err) {
    console.error('Request failed:', err.response?.data || err.message);
    setMessage('Error updating re-enrollment status.');
  }
};



  if (loading) return <p>Loading HOD Dashboard...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎓 HOD Dashboard</h1>

      {/* Medical Leave Requests */}
      <section>
        <h2>📋 Medical Leave Requests</h2>
        {leaves.length === 0 ? (
          <p>No leave requests found.</p>
        ) : (
          leaves.map(leave => (
            <div key={leave._id} style={cardStyle}>
              <p><strong>DID:</strong> {leave.did}</p>
              <p><strong>Date:</strong> {leave.date ? new Date(leave.date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Reason:</strong> {leave.reason}</p>
              <p><strong>Status:</strong> {leave.approved ? '✅ Approved' : '⏳ Pending'}</p>
              {!leave.approved && (
                <button onClick={() => approveLeave(leave._id)} style={buttonStyle}>Approve</button>
              )}
            </div>
          ))
        )}
      </section>

      {/* Schedule Change Requests */}
      <section>
        <h2>📅 Schedule Change Requests</h2>
        {scheduleRequests.length === 0 ? (
          <p>No schedule change requests found.</p>
        ) : (
          scheduleRequests.map(req => (
            <div key={req._id} style={cardStyle}>
              <p><strong>Faculty Name:</strong> {req.facultyName}</p>
              <p><strong>Class ID:</strong> {req.classId}</p>
              <p><strong>Old Date:</strong> {req.oldDate ? new Date(req.oldDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>New Date:</strong> {req.newDate ? new Date(req.newDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Reason:</strong> {req.reason}</p>
              <p><strong>Status:</strong> {req.approved ? '✅ Approved' : '⏳ Pending'}</p>
              {!req.approved && (
                <button onClick={() => approveSchedule(req._id)} style={buttonStyle}>Approve</button>
              )}
            </div>
          ))
        )}
      </section>

      {/* Re-Enrollment Requests */}
      <section>
        <h2>📩 Re-Enrollment Requests</h2>
        {message && <p style={{ marginBottom: '10px', color: '#1565c0', fontWeight: 'bold' }}>{message}</p>}
        {reEnrollments.length === 0 ? (
          <p>No re-enrollment requests found.</p>
        ) : (
          <table border="1" cellPadding="8" style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th>Student DID</th>
                <th>Courses</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reEnrollments.map(req => (
                <tr key={req._id}>
                  <td>{req.studentDID}</td>
                  <td>
                    {Array.isArray(req.courses)
                      ? req.courses.map(course =>
                          typeof course === 'object'
                            ? course.courseName || JSON.stringify(course)
                            : course
                        ).join(', ')
                      : req.courses}
                  </td>
                  <td>{req.reason}</td>
                  <td>
                    {req.status === 'pending'
                      ? '⏳ Pending'
                      : req.status === 'Approved'
                      ? '✅ Approved'
                      : '❌ Rejected'}
                  </td>
                  <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleReEnrollmentAction(req._id, 'Approved')}
                          style={buttonStyle}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReEnrollmentAction(req._id, 'Rejected')}
                          style={{ ...buttonStyle, backgroundColor: '#f44336', marginLeft: '8px' }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    ) : (
                      <em>No action needed</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

const cardStyle = {
  border: '1px solid #ddd',
  marginBottom: '15px',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#f9f9f9',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const buttonStyle = {
  padding: '8px 12px',
  marginTop: '8px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default HODScheduleDashboard;
