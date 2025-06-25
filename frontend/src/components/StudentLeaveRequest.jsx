import React, { useEffect, useState, useCallback } from 'react';

const StudentLeaveRequest = () => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const studentDID = localStorage.getItem('studentDID');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';


  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);
  useEffect(() => {
  console.log("Fetching leaves for DID:", studentDID);
  fetchLeaves();
}, [fetchLeaves]);

const fetchLeaves = useCallback(async () => {
  if (!studentDID) {
    setError('Student DID is missing. Please login again.');
    return;
  }
  try {
    setError(null);
    const res = await fetch(`${backendUrl}/api/leaves/${studentDID}`);
    console.log('Response status:', res.status);
    if (!res.ok) throw new Error('Failed to fetch leaves');
    const data = await res.json();
    console.log('Fetched leaves:', data);
    setLeaves(data);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    setError('Error fetching leave requests.');
  }
}, [studentDID, backendUrl]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentDID) {
      setError('Student DID missing. Cannot submit leave request.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${backendUrl}/api/leaves/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentDID, reason, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit leave request');
      alert(data.message);
      setReason('');
      setDate('');
      fetchLeaves(); // Refresh after submission
    } catch (err) {
      console.error('Submit leave error:', err);
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3>Request Medical Leave</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={submitting}
        />
        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !studentDID}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <h4>Submitted Leave Requests</h4>
      {leaves.length === 0 ? (
        <p>No leave requests yet.</p>
      ) : (
        <ul>
          {leaves.map((leave) => (
            <li key={leave._id}>
              <strong>Date:</strong> {new Date(leave.date).toLocaleDateString()} |{' '}
              <strong>Reason:</strong> {leave.reason} |{' '}
              <strong>Status:</strong> {leave.approved ? 'Approved' : 'Pending'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentLeaveRequest;
