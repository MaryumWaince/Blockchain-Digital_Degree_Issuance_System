import React, { useEffect, useState } from 'react';

const HODScheduleDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [leaveRes, scheduleRes] = await Promise.all([
        fetch('/api/leaves/all'),
        fetch('/api/schedule/all')
      ]);
      const [leaveData, scheduleData] = await Promise.all([
        leaveRes.json(),
        scheduleRes.json()
      ]);

      // ✅ Optional debug logs
      console.log('Leaves:', leaveData);
      console.log('Schedules:', scheduleData);

      setLeaves(leaveData);
      setScheduleRequests(scheduleData);
    } catch (err) {
      console.error('Error loading HOD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveLeave = async (id) => {
    try {
      const res = await fetch(`/api/leaves/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setLeaves(prev => prev.map(l => l._id === id ? { ...l, approved: true } : l));
        alert('Leave approved.');
      }
    } catch (err) {
      alert('Failed to approve leave.');
    }
  };

  const approveSchedule = async (id) => {
    try {
      const res = await fetch(`/api/schedule/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setScheduleRequests(prev => prev.map(r => r._id === id ? { ...r, approved: true } : r));
        alert('Schedule change approved.');
      }
    } catch (err) {
      alert('Failed to approve schedule change.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>HOD Dashboard - Approvals</h2>

      <h3>📋 Medical Leave Requests</h3>
      {leaves.length === 0 ? (
        <p>No leave requests.</p>
      ) : (
        leaves.map(leave => (
          <div key={leave._id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
            <p><strong>DID:</strong> {leave.did}</p>
            <p><strong>Date:</strong> {leave.date ? new Date(leave.date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Reason:</strong> {leave.reason}</p>
            <p><strong>Status:</strong> {leave.approved ? '✅ Approved' : '⏳ Pending'}</p>
            {!leave.approved && (
              <button onClick={() => approveLeave(leave._id)}>Approve Leave</button>
            )}
          </div>
        ))
      )}

      <h3>📅 Faculty Schedule Change Requests</h3>
      {scheduleRequests.length === 0 ? (
        <p>No schedule change requests.</p>
      ) : (
        scheduleRequests.map(req => (
          <div key={req._id} style={{ border: '1px solid #aaa', marginBottom: '10px', padding: '10px' }}>
            <p><strong>Faculty:</strong> {req.facultyName}</p>
            <p><strong>Class ID:</strong> {req.classId}</p>
            <p><strong>Old Date:</strong> {req.oldDate ? new Date(req.oldDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>New Date:</strong> {req.newDate ? new Date(req.newDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Reason:</strong> {req.reason}</p>
            <p><strong>Status:</strong> {req.approved ? '✅ Approved' : '⏳ Pending'}</p>
            {!req.approved && (
              <button onClick={() => approveSchedule(req._id)}>Approve Schedule Change</button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default HODScheduleDashboard;
