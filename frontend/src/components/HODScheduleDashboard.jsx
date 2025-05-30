// src/components/HODScheduleDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/HODDashboard.css';
import AddCourseForm from './AddCourseForm';

const HODScheduleDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [reEnrollments, setReEnrollments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    leaves: false,
    schedule: false,
    reenrollments: false,
    addcourse: false
  });

  const toggleSection = section => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaveRes, scheduleRes, reenrollRes] = await Promise.all([
          axios.get(`${baseURL}/api/leaves/all`),
          axios.get(`${baseURL}/api/schedule/all`),
          axios.get(`${baseURL}/api/reenrollment`)
        ]);

        setLeaves(leaveRes.data);
        setScheduleRequests(scheduleRes.data);
        setReEnrollments(reenrollRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setMessage('Failed to load dashboard data.');
        setLoading(false);
      }
    };

    fetchData();
  }, [baseURL]);

  const approveLeave = async id => {
    try {
      await axios.post(`${baseURL}/api/leaves/approve/${id}`);
      setLeaves(prev => prev.map(l => (l._id === id ? { ...l, approved: true } : l)));
    } catch {
      alert('Error approving leave');
    }
  };

  const approveSchedule = async id => {
    try {
      await axios.post(`${baseURL}/api/schedule/approve/${id}`);
      setScheduleRequests(prev => prev.map(r => (r._id === id ? { ...r, approved: true } : r)));
    } catch {
      alert('Error approving schedule');
    }
  };

  const handleReEnrollmentAction = async (id, status) => {
    try {
      await axios.patch(`${baseURL}/api/reenrollment/${id}/status`, { status });
      const res = await axios.get(`${baseURL}/api/reenrollment`);
      setReEnrollments(res.data);
      setMessage(`Re-enrollment ${status}`);
    } catch (err) {
      setMessage('Failed to update re-enrollment');
    }
  };

  if (loading) return <p>Loading HOD Dashboard...</p>;

  return (
    <div className="hod-dashboard">
      <h1 className="dashboard-heading">🎓 HOD Dashboard</h1>

      <section>
        <h2 className="section-heading" onClick={() => toggleSection('leaves')}>
          📋 Medical Leave Requests {openSections.leaves ? '🔽' : '▶️'}
        </h2>
        {openSections.leaves && (
          <table className="table-style">
            <thead>
              <tr><th>DID</th><th>Date</th><th>Reason</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id}>
                  <td>{leave.did}</td>
                  <td>{new Date(leave.date).toLocaleDateString()}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.approved ? '✅' : '⏳'}</td>
                  <td>{!leave.approved && <button className="button-style" onClick={() => approveLeave(leave._id)}>Approve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="section-heading" onClick={() => toggleSection('schedule')}>
          📅 Schedule Change Requests {openSections.schedule ? '🔽' : '▶️'}
        </h2>
        {openSections.schedule && (
          <table className="table-style">
            <thead>
              <tr><th>Faculty</th><th>Class</th><th>Old Date</th><th>New Date</th><th>Reason</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {scheduleRequests.map(req => (
                <tr key={req._id}>
                  <td>{req.facultyName}</td>
                  <td>{req.classId}</td>
                  <td>{new Date(req.oldDate).toLocaleDateString()}</td>
                  <td>{new Date(req.newDate).toLocaleDateString()}</td>
                  <td>{req.reason}</td>
                  <td>{req.approved ? '✅' : '⏳'}</td>
                  <td>{!req.approved && <button className="button-style" onClick={() => approveSchedule(req._id)}>Approve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="section-heading" onClick={() => toggleSection('reenrollments')}>
          📩 Re-Enrollment Requests {openSections.reenrollments ? '🔽' : '▶️'}
        </h2>
        {openSections.reenrollments && (
          <table className="table-style">
            <thead>
              <tr><th>DID</th><th>Courses</th><th>Reason</th><th>Status</th><th>Submitted</th><th>Action</th></tr>
            </thead>
            <tbody>
              {reEnrollments.map(req => (
                <tr key={req._id}>
                  <td>{req.studentDID}</td>
                  <td>{req.courses.map(c => typeof c === 'object' ? c.courseName : c).join(', ')}</td>
                  <td>{req.reason}</td>
                  <td>{req.status}</td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    {req.status === 'pending' && (
                      <>
                        <button className="button-style" onClick={() => handleReEnrollmentAction(req._id, 'Approved')}>✅</button>
                        <button className="button-style button-danger" onClick={() => handleReEnrollmentAction(req._id, 'Rejected')}>❌</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="section-heading" onClick={() => toggleSection('addcourse')}>
          ➕ Add New Course {openSections.addcourse ? '🔽' : '▶️'}
        </h2>
        {openSections.addcourse && <AddCourseForm />}
      </section>
    </div>
  );
};

export default HODScheduleDashboard;
