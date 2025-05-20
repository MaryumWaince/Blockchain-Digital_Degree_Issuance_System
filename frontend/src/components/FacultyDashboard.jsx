import React, { useEffect, useState } from 'react';
import FacultyScheduleChange from './FacultyScheduleChange';
import axios from 'axios';

const FacultyDashboard = () => {
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [courseAttendance, setCourseAttendance] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [gradeInput, setGradeInput] = useState({
    studentDID: '',
    courseName: '',
    semester: '',
    marks: ''
  });
  const [gradeStatus, setGradeStatus] = useState('');

  const [gpaInputDID, setGpaInputDID] = useState('');
  const [gpaData, setGpaData] = useState(null);
  const [gpaStatus, setGpaStatus] = useState('');

  const [reEnrollments, setReEnrollments] = useState([]);
  const [reEnrollGradeInput, setReEnrollGradeInput] = useState({});
  const [reEnrollGradeStatus, setReEnrollGradeStatus] = useState('');

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

  useEffect(() => {
    const fetchReEnrollments = async () => {
      try {
        if (facultyName) {
          const res = await fetch(`${backendUrl}/api/reenrollment/faculty/${facultyName}/Approved`);
          const data = await res.json();
          setReEnrollments(data);

          const initialInputs = {};
          data.forEach(req => {
            req.courses.forEach(course => {
              initialInputs[`${req.studentDID}_${course.courseName}`] = '';
            });
          });
          setReEnrollGradeInput(initialInputs);
        }
      } catch (err) {
        console.error('Error fetching re-enrollment requests:', err);
      }
    };
    fetchReEnrollments();
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
    const { studentDID, courseName, semester, marks } = gradeInput;
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
      setGradeInput({ studentDID: '', courseName: '', semester: '', marks: '' });
    } catch (err) {
      setGradeStatus('Failed to submit grade');
      console.error('Grade submission error:', err.response?.data || err.message);
    }
  };

  const submitReEnrollGrade = async (studentDID, courseName, semester) => {
    const key = `${studentDID}_${courseName}`;
    const marks = reEnrollGradeInput[key];
    if (!marks) {
      setReEnrollGradeStatus('Please enter marks before submitting.');
      return;
    }

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
      setReEnrollGradeStatus('Failed to submit grade');
      console.error('Re-enrollment grade submission error:', err.response?.data || err.message);
    }
  };

  const fetchGpaCgpa = async () => {
    if (!gpaInputDID) {
      setGpaStatus('Enter student DID');
      return;
    }

    try {
      const res = await axios.get(`${backendUrl}/api/grades/gpa/${gpaInputDID}`);
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

      {/* Grade Assignment */}
      <section>
        <h3>📚 Grade Assignment</h3>
        <input
          placeholder="Student DID"
          value={gradeInput.studentDID}
          onChange={e => setGradeInput({ ...gradeInput, studentDID: e.target.value })}
        />
        <input
          placeholder="Course Name"
          value={gradeInput.courseName}
          onChange={e => setGradeInput({ ...gradeInput, courseName: e.target.value })}
        />
        <input
          placeholder="Semester"
          value={gradeInput.semester}
          onChange={e => setGradeInput({ ...gradeInput, semester: e.target.value })}
        />
        <input
          placeholder="Obtained Marks"
          type="number"
          value={gradeInput.marks}
          onChange={e => setGradeInput({ ...gradeInput, marks: e.target.value })}
        />
        <button onClick={submitGrade}>Assign Grade</button>
        {gradeStatus && <p>{gradeStatus}</p>}
      </section>

      <hr />

      {/* Schedule Change Section */}
      <section>
        <h3>📅 Request Class Schedule Change</h3>
        <FacultyScheduleChange />
      </section>

      <section>
        <h3>🕒 My Schedule Change Requests</h3>
        {scheduleRequests.length === 0 ? (
          <p>No requests submitted yet.</p>
        ) : (
          <ul>
            {scheduleRequests.map(req => (
              <li key={req._id}>
                Class: {req.classId} — {new Date(req.oldDate).toLocaleDateString()} → {new Date(req.newDate).toLocaleDateString()} — {req.approved ? '✅ Approved' : '⏳ Pending'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />

      {/* Course Attendance Section */}
      <section>
        <h3>🧑‍🏫 View Course Attendance</h3>
        <input
          placeholder="Enter Course"
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
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
      </section>

      <hr />

      {/* ✅ Approved Re-Enrollment Requests */}
      <section>
        <h2>🔁 Approved Re-Enrollment Requests</h2>
        {reEnrollments.filter(req => req.status === 'Approved').length === 0 ? (
          <p>No approved re-enrollment requests.</p>
        ) : (
          <ul>
            {reEnrollments
              .filter(req => req.status === 'Approved')
              .map(req => (
                <li key={req._id}>
                  Semester: {req.semester} — Courses: {req.courses.map(course => course.courseName).join(', ')}
                </li>
              ))}
          </ul>
        )}
      </section>

      <hr />

      {/* Re-enrollment Grades */}
      <section>
        <h3>📝 Submit Grades for Approved Re-Enrollment Requests</h3>
        {reEnrollments.length === 0 ? (
          <p>No approved re-enrollment requests.</p>
        ) : (
          reEnrollments.map(request => (
            <div key={request._id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
              <p><strong>Student DID:</strong> {request.studentDID}</p>
              <p><strong>Semester:</strong> {request.semester}</p>
              <p><strong>Courses:</strong> {request.courses.map(c => c.courseName).join(', ')}</p>

              <ul>
                {request.courses.map(course => {
                  const key = `${request.studentDID}_${course.courseName}`;
                  return (
                    <li key={course.courseName}>
                      {course.courseName} - 
                      <input
                        type="number"
                        placeholder="Enter marks"
                        value={reEnrollGradeInput[key] || ''}
                        onChange={e =>
                          setReEnrollGradeInput(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))
                        }
                      />
                      <button onClick={() => submitReEnrollGrade(request.studentDID, course.courseName, request.semester)}>
                        Submit
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
        {reEnrollGradeStatus && <p>{reEnrollGradeStatus}</p>}
      </section>

      <hr />

      {/* GPA & CGPA */}
      <section>
        <h3>📊 View GPA / CGPA</h3>
        <input
          placeholder="Enter Student DID"
          value={gpaInputDID}
          onChange={e => setGpaInputDID(e.target.value)}
/>
<button onClick={fetchGpaCgpa}>Get GPA / CGPA</button>
{gpaStatus && <p>{gpaStatus}</p>}
{gpaData && (
<div>
<p>GPA: {gpaData.gpa}</p>
<p>CGPA: {gpaData.cgpa}</p>
</div>
)}
</section>
</div>
);
};

export default FacultyDashboard;
