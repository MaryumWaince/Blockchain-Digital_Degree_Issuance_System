import React, { useState } from 'react';
import axios from 'axios';
import '../styles/LeaveRequestsPage.css'; 


const LeaveRequestsPage = ({ did, existing = [] }) => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason || !date) {
      setError('Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axios.post(`${backendUrl}/api/leaves`, {
        studentDID: did,
        reason,
        date,
        status: 'pending',
      });
      setSubmitted(true);
      setReason('');
      setDate('');
    } catch (err) {
      setError('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="leave-request-page">
      <form onSubmit={handleSubmit} className="leave-form">
        <h3>Apply for Leave</h3>
        {error && <p className="error-text">{error}</p>}
        {submitted && <p className="success-text">Leave request submitted!</p>}

        <div>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Reason:</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>

      <div className="leave-history">
        <h3>Leave History</h3>
        {existing.length === 0 ? (
          <p>No leave requests yet.</p>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {existing.map((leave, idx) => (
                <tr key={idx}>
                  <td>{leave.date?.substring(0, 10)}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestsPage;

