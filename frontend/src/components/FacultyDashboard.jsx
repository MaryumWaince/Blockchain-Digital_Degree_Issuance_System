// File: src/pages/FacultyDashboard.jsx
import React, { useEffect, useState } from 'react';
import FacultyScheduleChange from '../components/FacultyScheduleChange';
import axios from 'axios';
import '../styles/FacultyDashboard.css';

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState('grades');
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [courseAttendance, setCourseAttendance] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradeInput, setGradeInput] = useState({ studentDID: '', courseName: '', semester: '', marks: '' });
  const [gradeStatus, setGradeStatus] = useState('');
  const [reEnrollments, setReEnrollments] = useState([]);
  const [reEnrollGradeInput, setReEnrollGradeInput] = useState({});
  const [reEnrollGradeStatus, setReEnrollGradeStatus] = useState('');

  const facultyName = JSON.parse(localStorage.getItem('user'))?.name;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!facultyName) return;
    fetch(`${backendUrl}/api/schedule/faculty/${facultyName}`)
      .then(res => res.json())
      .then(setScheduleRequests)
      .catch(err => console.error('Schedule fetch error:', err));
  }, [facultyName]);

  useEffect(() => {
    if (!facultyName) return;
    fetch(`${backendUrl}/api/reenrollment/faculty/${facultyName}/Approved`)
      .then(res => res.json())
      .then(data => {
        setReEnrollments(data);
        const inputs = {};
        data.forEach(r => r.courses.forEach(c => { inputs[`${r.studentDID}_${c.courseName}`] = ''; }));
        setReEnrollGradeInput(inputs);
      })
      .catch(err => console.error('Reenrollment fetch error:', err));
  }, [facultyName]);

  const fetchCourseAttendance = async () => {
    if (!selectedCourse) return;
    try {
      const res = await axios.get(`${backendUrl}/api/attendance/course/${selectedCourse}`);
      setCourseAttendance(res.data);
    } catch (err) {
      console.error('Attendance fetch error:', err);
    }
  };

  const submitGrade = async () => {
  const { studentDID, courseName, semester, marks } = gradeInput;

  if (!studentDID || !courseName || !semester || !marks) {
    return setGradeStatus('All fields required.');
  }

  try {
    const res = await axios.post(`${backendUrl}/api/grades/submit`, {
      studentDID,
      courseName,
      semester: Number(semester),
      obtainedMarks: Number(marks)
    });

    setGradeStatus(res.data.message || 'Grade submitted.');
    setGradeInput({ studentDID: '', courseName: '', semester: '', marks: '' });
  } catch (err) {
    console.error('Grade submission error:', err.response?.data || err.message || err);
    setGradeStatus(err.response?.data?.message || 'Error submitting grade.');
  }
};


  const submitReEnrollGrade = async (studentDID, courseName, semester) => {
    const key = `${studentDID}_${courseName}`;
    const marks = reEnrollGradeInput[key];
    if (!marks) return setReEnrollGradeStatus('Enter marks.');

    try {
      await axios.post(`${backendUrl}/api/grades/submit`, {
        studentDID,
        courseName,
        semester: Number(semester),
        obtainedMarks: Number(marks)
      });
      setReEnrollGradeStatus(`Grade submitted for ${studentDID} - ${courseName}`);
      setReEnrollGradeInput(prev => ({ ...prev, [key]: '' }));
    } catch (err) {
      setReEnrollGradeStatus('Error submitting re-enrollment grade.');
    }
  };

  return (
    <div className="faculty-dashboard">
      <h1 className="dashboard-title">👨‍🏫 Faculty Dashboard</h1>

      <div className="tab-buttons">
        <button className={activeTab === 'grades' ? 'active' : ''} onClick={() => setActiveTab('grades')}>📚 Assign Grades</button>
        <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}>📅 Schedule Requests</button>
        <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>🧾 View Attendance</button>
        <button className={activeTab === 'reenroll' ? 'active' : ''} onClick={() => setActiveTab('reenroll')}>🔁 Re-Enrollment Grades</button>
      </div>

      {activeTab === 'grades' && (
        <section className="section-card">
          <h2>📚 Assign Grades</h2>
          <div className="form-inline">
            {['studentDID', 'courseName', 'semester', 'marks'].map(field => (
              <input
                key={field}
                placeholder={field}
                value={gradeInput[field]}
                onChange={e => setGradeInput(prev => ({ ...prev, [field]: e.target.value }))}
              />
            ))}
            <button onClick={submitGrade}>Submit</button>
          </div>
          {gradeStatus && <p className="status-message">{gradeStatus}</p>}
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="section-card">
          <h2>📅 Schedule Change</h2>
          <FacultyScheduleChange />
          <h3 style={{ marginTop: '20px' }}>📖 My Requests Status</h3>
          <div className="table-container">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Old Date</th>
                  <th>New Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRequests.length === 0 ? (
                  <tr><td colSpan="4">No requests.</td></tr>
                ) : (
                  scheduleRequests.map(req => (
                    <tr key={req._id}>
                      <td>{req.classId}</td>
                      <td>{new Date(req.oldDate).toLocaleDateString()}</td>
                      <td>{new Date(req.newDate).toLocaleDateString()}</td>
                      <td>{req.approved ? '✅ Approved' : '⏳ Pending'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'attendance' && (
        <section className="section-card">
          <h2>🧾 View Attendance</h2>
          <div className="attendance-inputs">
            <input
              placeholder="Enter Course"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            />
            <button onClick={fetchCourseAttendance}>Fetch</button>
          </div>
          <ul>
            {courseAttendance.map((r, i) => (
              <li key={i}>Date: {new Date(r.date).toLocaleDateString()} | DID: {r.did} | Status: {r.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === 'reenroll' && (
        <section className="section-card">
          <h2>🔁 Re-Enrollment Grades</h2>
          {reEnrollments.map(req => (
            <div key={req._id} className="reenroll-box">
              <p><strong>DID:</strong> {req.studentDID}</p>
              <p><strong>Semester:</strong> {req.semester}</p>
              <ul>
                {req.courses.map(course => {
                  const key = `${req.studentDID}_${course.courseName}`;
                  return (
                    <li key={course.courseName}>
                      {course.courseName}:
                      <input
                        type="number"
                        placeholder="marks"
                        value={reEnrollGradeInput[key] || ''}
                        onChange={e => setReEnrollGradeInput(p => ({ ...p, [key]: e.target.value }))}
                      />
                      <button onClick={() => submitReEnrollGrade(req.studentDID, course.courseName, req.semester)}>Submit</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {reEnrollGradeStatus && <p className="status-message">{reEnrollGradeStatus}</p>}
        </section>
      )}
    </div>
  );
};

export default FacultyDashboard;
