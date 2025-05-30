// src/pages/FeeStatusPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FeeStatusPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!studentDID) {
      setError('Student DID not found. Log in again.');
      setLoading(false);
      return;
    }

    axios.get(`${backendUrl}/api/fees/${studentDID}`)
      .then(res => {
        setFees(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error fetching fees');
        setLoading(false);
      });
  }, [studentDID, backendUrl]);

  if (loading) return <p>Loading fee status...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>💳 Fee Status</h1>
      <ul>
        {fees.length > 0 ? (
          fees.map(fee => (
            <li key={fee._id}>Semester {fee.semester}: {fee.status}</li>
          ))
        ) : (
          <li>No fee records found.</li>
        )}
      </ul>
    </div>
  );
};

export default FeeStatusPage;
