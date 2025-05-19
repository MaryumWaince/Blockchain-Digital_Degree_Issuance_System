// File: src/components/StudentLeaveRequest.jsx
import React, { useEffect, useState, useCallback } from 'react';

const StudentLeaveRequest = () => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [leaves, setLeaves] = useState([]);
  const did = localStorage.getItem('studentDID');

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaves/${did}`);
      const data = await res.json();
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  }, [did]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/leaves/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, reason, date })
    });
    const data = await res.json();
    alert(data.message);
    setReason('');
    setDate('');
    fetchLeaves(); // Refresh list after new request
  };

  return (
    <div>
      <h3>Request Medical Leave</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
        <button type="submit">Submit</button>
      </form>

      <h4>Submitted Leave Requests</h4>
      <ul>
        {leaves.map((leave, idx) => (
          <li key={idx}>
            <strong>Date:</strong> {new Date(leave.date).toLocaleDateString()} |{' '}
            <strong>Reason:</strong> {leave.reason} |{' '}
            <strong>Status:</strong> {leave.approved ? 'Approved' : 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentLeaveRequest;
