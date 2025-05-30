// src/pages/ReEnrollmentPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReEnrollmentForm from '../components/ReEnrollmentForm';
import '../styles/ReEnrollmentPage.css';

const ReEnrollmentPage = () => {
  const [reenrollments, setReenrollments] = useState([]);
  const [error, setError] = useState(null);
  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!studentDID) {
      setError('Student DID not found. Please log in again.');
      return;
    }

    const fetchReEnrollments = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/reenrollment/student/${studentDID}`);
        setReenrollments(res.data || []);
      } catch (err) {
        setError('Error fetching re-enrollment requests.');
      }
    };

    fetchReEnrollments();
  }, [studentDID, backendUrl]);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="reenroll-page">
      <h1 className="reenroll-heading">🔄 Re-enrollment Portal</h1>

      <section className="reenroll-section">
        <h2>📝 Submit New Request</h2>
        <ReEnrollmentForm />
      </section>

      <section className="reenroll-section">
        <h2>📄 Previous Requests</h2>
        {reenrollments.length > 0 ? (
          <ul className="reenroll-list">
            {reenrollments.map(req => (
              <li key={req._id} className="reenroll-item">
                <strong>Semester:</strong> {req.semester} &mdash;
                <strong> Courses:</strong> {req.courses.map(c => c.courseName).join(', ')} &mdash;
                <strong> Status:</strong>{' '}
                {req.status === 'Approved'
                  ? '✅ Approved'
                  : req.status === 'Rejected'
                  ? '❌ Rejected'
                  : '⏳ Pending'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-requests">No re-enrollment requests found.</p>
        )}
      </section>
    </div>
  );
};

export default ReEnrollmentPage;

