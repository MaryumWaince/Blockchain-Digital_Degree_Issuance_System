// File: src/components/FacultyDashboard.jsx
import React, { useEffect, useState } from 'react';

const FacultyDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch('/api/faculty/students')
      .then(res => res.json())
      .then(setStudents);
  }, []);

  return (
    <div>
      <h2>Faculty Dashboard</h2>
      {students.map(s => (
        <div key={s.did} style={{ border: '1px solid #ccc', marginBottom: '10px' }}>
          <p>DID: {s.did}</p>
          <p>Course: {s.course}</p>
          <p>Semester: {s.semester}</p>
          <p>Attendance: {s.attendance}</p>
          <p>Grade: {s.grade}</p>
        </div>
      ))}
    </div>
  );
};

export default FacultyDashboard;
/*
import React, { useState } from 'react';
import axios from 'axios';

const FacultyDashboard = () => {
  const [studentDID, setStudentDID] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [grade, setGrade] = useState('');

  const handleAttendance = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/attendance/record`, { 
        studentDID, status: attendanceStatus, fingerprintHash 
      });
      alert('Attendance Recorded Successfully');
    } catch (error) {
      alert('Failed to Record Attendance');
    }
  };

  const handleGrading = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/grades/record`, { 
        studentDID, course, semester, grade, recordedBy: '0xFacultyDID'
      });
      alert('Grade Recorded Successfully');
    } catch (error) {
      alert('Failed to Record Grade');
    }
  };

  return (
    <div>
      <h1>Faculty Dashboard</h1>

      <h2>Record Attendance</h2>
      <input placeholder="Student DID" value={studentDID} onChange={(e) => setStudentDID(e.target.value)} />
      <input placeholder="Status (Present/Absent)" value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value)} />
      <input placeholder="Fingerprint Hash" value={fingerprintHash} onChange={(e) => setFingerprintHash(e.target.value)} />
      <button onClick={handleAttendance}>Record Attendance</button>

      <h2>Record Grades</h2>
      <input placeholder="Course" value={course} onChange={(e) => setCourse(e.target.value)} />
      <input placeholder="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
      <input placeholder="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
      <button onClick={handleGrading}>Record Grade</button>
    </div>
  );
};

export default FacultyDashboard;

*/