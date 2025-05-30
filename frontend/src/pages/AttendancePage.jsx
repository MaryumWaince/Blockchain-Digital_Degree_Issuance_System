import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AttendancePage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const studentDID = params.get('did'); // ✅ Get DID from query string

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!studentDID) return;

    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/attendance/student/${studentDID}`);
        setAttendance(res.data || []);
        setLoading(false);
      } catch (e) {
        setError('Failed to fetch attendance');
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentDID]);

  if (!studentDID) return <p style={{ color: 'red' }}>Student DID is missing in URL</p>;
  if (loading) return <p>Loading attendance...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>📅 Attendance Records</h2>
      <ul>
        {attendance.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          attendance.map((r, i) => (
            <li key={i}>
              {new Date(r.date).toLocaleDateString()} — {r.course} — {r.status}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default AttendancePage;
