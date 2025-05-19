import React, { useEffect, useState } from 'react';
import FacultyScheduleChange from './FacultyScheduleChange';
import axios from 'axios';

const FacultyDashboard = () => {
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [courseAttendance, setCourseAttendance] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [studentDID, setStudentDID] = useState('');
  const [semester, setSemester] = useState('');
  const [marks, setMarks] = useState('');
  const [courseName, setCourseName] = useState('');
  const [gradeStatus, setGradeStatus] = useState('');
  const [gpaData, setGpaData] = useState(null);
  const [gpaStatus, setGpaStatus] = useState('');

  const facultyName = JSON.parse(localStorage.getItem('user'))?.name;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (facultyName) {
          const res = await fetch(`${backendUrl}/api/schedule/faculty/${facultyName}`);
          const requestData = await res.json();
          setScheduleRequests(requestData);
        }
      } catch (err) {
        console.error('Error fetching schedule requests:', err);
      }
    };

    fetchRequests();
  }, [facultyName, backendUrl]);

  const fetchCourseAttendance = async () => {
    if (!selectedCourse) return;
    try {
      const res = await axios.get(`${backendUrl}/api/attendance/course/${selectedCourse}`);
      setCourseAttendance(res.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const submitGrade = async () => {
    if (!studentDID || !courseName || !semester || !marks) {
      setGradeStatus('Please fill all fields before submitting.');
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/api/grades/submit`, {
        studentDID,
        courseName,
        semester: Number(semester),
        obtainedMarks: Number(marks)
      });

      setGradeStatus(res.data.message || 'Grade submitted');
    } catch (err) {
      setGradeStatus('Failed to submit grade');
      console.error('Grade submission error:', err.response?.data || err.message);
    }
  };

  const fetchGpaCgpa = async () => {
    if (!studentDID) {
      setGpaStatus('Enter student DID');
      return;
    }

    try {
      const res = await axios.get(`${backendUrl}/api/grades/gpa/${studentDID}`);
      setGpaData(res.data);
      setGpaStatus('');
    } catch (err) {
      console.error('Failed to fetch GPA/CGPA');
      setGpaStatus('Failed to fetch GPA/CGPA');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Faculty Dashboard</h2>

      <h3>📚 Grade Assignment</h3>
      <div>
        <input placeholder="Student DID" value={studentDID} onChange={e => setStudentDID(e.target.value)} />
        <input placeholder="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} />
        <input placeholder="Semester" value={semester} onChange={e => setSemester(e.target.value)} />
        <input placeholder="Obtained Marks" value={marks} onChange={e => setMarks(e.target.value)} type="number" />
        <button onClick={submitGrade}>Assign Grade</button>
        {gradeStatus && <p>{gradeStatus}</p>}
      </div>

      <hr />

      <h3>📅 Request Class Schedule Change</h3>
      <FacultyScheduleChange />

      <h3>🕒 My Schedule Change Requests</h3>
      {scheduleRequests.length === 0 ? (
        <p>No requests submitted yet.</p>
      ) : (
        <ul>
          {scheduleRequests.map(req => (
            <li key={req._id}>
              Class: {req.classId} — {new Date(req.oldDate).toLocaleDateString()} → {new Date(req.newDate).toLocaleDateString()} —{' '}
              {req.approved ? '✅ Approved' : '⏳ Pending'}
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h3>🧑‍🏫 View Course Attendance</h3>
      <div>
        <input
          placeholder="Enter Course"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        />
        <button onClick={fetchCourseAttendance}>Fetch Attendance</button>
        {courseAttendance.length > 0 && (
          <ul>
            {courseAttendance.map((record, idx) => (
              <li key={idx}>
                Date: {new Date(record.date).toLocaleDateString()} | DID: {record.did} | Course: {record.course} | Status: {record.status}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr />

      <h3>📊 View GPA & CGPA</h3>
      <div>
        <input
          placeholder="Enter Student DID"
          value={studentDID}
          onChange={(e) => setStudentDID(e.target.value)}
        />
        <button onClick={fetchGpaCgpa}>Fetch GPA/CGPA</button>
        {gpaStatus && <p>{gpaStatus}</p>}
        {gpaData && (
          <div>
            <p><strong>CGPA:</strong> {gpaData.cgpa}</p>
            <ul>
              {gpaData.semesters.map((sem, index) => (
                <li key={index}>
                  Semester: {sem.semester} — GPA: {sem.gpa}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;





