import { useEffect, useState } from 'react';
import axios from 'axios';
import StudentLeaveRequest from './StudentLeaveRequest';
import DegreeCertificate from './DegreeCertificate';
import ReEnrollmentForm from './ReEnrollmentForm';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gpaData, setGpaData] = useState({ semesters: [], cgpa: null });
  const [reenrollments, setReenrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDegree, setShowDegree] = useState(false); // 🔍 Toggle for degree

  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (studentDID) {
      localStorage.setItem('studentDID', studentDID);
    }
  }, [studentDID]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentDID) throw new Error('Student DID not found. Please log in again.');

        const [
          studentRes,
          attendanceRes,
          gradesRes,
          feesRes,
          leavesRes,
          gpaRes,
          reenrollRes
        ] = await Promise.all([
          axios.get(`${backendUrl}/api/students/${studentDID}`),
          axios.get(`${backendUrl}/api/attendance/student/${studentDID}`),
          axios.get(`${backendUrl}/api/grades/${studentDID}`),
          axios.get(`${backendUrl}/api/fees/${studentDID}`),
          axios.get(`${backendUrl}/api/leaves/${studentDID}`),
          axios.get(`${backendUrl}/api/grades/gpa/${studentDID}`),
          axios.get(`${backendUrl}/api/reenrollment/student/${studentDID}`)
        ]);

        setStudentData(studentRes.data);
        setAttendance(attendanceRes.data || []);
        setGrades(gradesRes.data || []);
        setFees(feesRes.data || []);
        setLeaves(leavesRes.data || []);
        setGpaData(gpaRes.data || { semesters: [], cgpa: null });
        setReenrollments(reenrollRes.data || []);

        // Fetch courses for all paid semesters
        const paidSemesters = feesRes.data
          .filter(fee => fee.status === 'paid')
          .map(fee => Number(fee.semester));

        const allCourses = [];
        for (const semester of paidSemesters) {
          const res = await axios.get(`${backendUrl}/api/courses/${studentRes.data.degree}/${semester}`);
          res.data?.forEach(c => allCourses.push({ ...c, semester }));
        }

        setCourses(allCourses);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [studentDID, backendUrl]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>🎓 Student Dashboard</h1>

      <h2>👤 Personal Information</h2>
      <p>Name: {studentData?.name}</p>
      <p>CNIC: {studentData?.cnic}</p>
      <p>Contact: {studentData?.contact}</p>
      <p>Email: {studentData?.email}</p>
      <p>Degree: {studentData?.degree}</p>
      <p>Batch: {studentData?.batch}</p>
      <p>DID: {studentData?.did}</p>

      <h2>💳 Fee Status</h2>
      <ul>
        {fees.map((fee) => (
          <li key={fee._id}>Semester: {fee.semester}, Status: {fee.status}</li>
        ))}
      </ul>

      {courses.length > 0 && (
        <>
          <h2>📚 Enrolled Courses</h2>
          <ul>
            {courses.map((course) => (
              <li key={course._id}>Semester {course.semester} — {course.courseName}</li>
            ))}
          </ul>
        </>
      )}

      <h2>📅 Attendance</h2>
      <ul>
        {attendance.map((record, idx) => (
          <li key={idx}>
            {new Date(record.date).toLocaleDateString()} — Course: {record.course} — {record.status}
          </li>
        ))}
      </ul>

      <h2>📈 Grades</h2>
      <ul>
        {grades.map((grade) => (
          <li key={grade._id}>
            Semester: {grade.semester}, Course: {grade.course || grade.courseName}, Credit Hours: {grade.creditHours || 'N/A'},<br />
            Total Marks: {grade.totalMarks || 'N/A'}, Obtained: {grade.obtainedMarks || grade.marks}, Grade: {grade.grade}, Quality Points: {grade.qualityPoints || 'N/A'}
          </li>
        ))}
      </ul>

      <h2>📊 GPA Summary</h2>
      {gpaData.semesters.length > 0 ? (
        <>
          <ul>
            {gpaData.semesters.map((s, idx) => (
              <li key={idx}>Semester {s.semester} — GPA: {s.gpa}</li>
            ))}
          </ul>
          <p><strong>CGPA:</strong> {gpaData.cgpa}</p>
        </>
      ) : (
        <p>GPA summary not available yet.</p>
      )}

      <h2>📝 Leave Requests</h2>
      {leaves.length === 0 ? (
        <p>No leave requests yet.</p>
      ) : (
        <ul>
          {leaves.map((leave) => (
            <li key={leave._id}>
              {leave.reason} — {new Date(leave.date).toLocaleDateString()} — {leave.approved ? '✅ Approved' : '⏳ Pending'}
            </li>
          ))}
        </ul>
      )}

      <h2>🔁 Re-Enrollment Requests</h2>
      {reenrollments.length === 0 ? (
        <p>No re-enrollment requests yet.</p>
      ) : (
        <ul>
          {reenrollments.map((req) => (
            <li key={req._id}>
              Semester: {req.semester} — Courses: {req.courses.map(course => course.courseName).join(', ')} — 
              Status: {req.status === 'Approved' ? '✅ Approved' : req.status === 'Rejected' ? '❌ Rejected' : '⏳ Pending'}
            </li>
          ))}
        </ul>
      )}

      <StudentLeaveRequest />
      <ReEnrollmentForm />

      <hr />
      <h2>🎓 Degree Certificate</h2>
      {!showDegree ? (
        <button onClick={() => setShowDegree(true)}>View Degree</button>
      ) : (
        <DegreeCertificate studentDID={studentDID} />
      )}
    
    </div>
  );
};

export default StudentDashboard;


/*
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentLeaveRequest from './StudentLeaveRequest';
import DegreeCertificate from './DegreeCertificate';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gpaData, setGpaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentDID) throw new Error('Student DID not found. Please log in again.');

        const [
          studentRes,
          attendanceRes,
          gradesRes,
          feesRes,
          leavesRes,
          gpaRes
        ] = await Promise.all([
          axios.get(`${backendUrl}/api/students/${studentDID}`),
          axios.get(`${backendUrl}/api/attendance/student/${studentDID}`),
          axios.get(`${backendUrl}/api/grades/${studentDID}`),
          axios.get(`${backendUrl}/api/fees/${studentDID}`),
          axios.get(`${backendUrl}/api/leaves/${studentDID}`),
          axios.get(`${backendUrl}/api/grades/gpa/${studentDID}`)
        ]);

        setStudentData(studentRes.data);
        setAttendance(attendanceRes.data || []);
        setGrades(gradesRes.data || []);
        setFees(feesRes.data || []);
        setLeaves(leavesRes.data || []);
        setGpaData(gpaRes.data || { semesters: [], cgpa: null });

        const sem1Fee = feesRes.data.find(fee => Number(fee.semester) === 1 && fee.status === 'paid');
        if (sem1Fee && studentRes.data.degree) {
          const coursesRes = await axios.get(`${backendUrl}/api/courses/${studentRes.data.degree}/1`);
          setCourses(coursesRes.data || []);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [studentDID, backendUrl]);

  // Check if all semester 1 courses have grades submitted
  const hasAllGradesForSem1 = () => {
    const semester1Courses = courses.filter(c => Number(c.semester) === 1);
    const semester1Grades = grades.filter(g => Number(g.semester) === 1);
    return semester1Courses.length > 0 && semester1Grades.length === semester1Courses.length;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Student Dashboard</h1>

      <h2>Personal Information</h2>
      <p>Name: {studentData?.name}</p>
      <p>CNIC: {studentData?.cnic}</p>
      <p>Contact: {studentData?.contact}</p>
      <p>Email: {studentData?.email}</p>
      <p>Degree: {studentData?.degree}</p>
      <p>Batch: {studentData?.batch}</p>
      <p>DID: {studentData?.did}</p>

      <h2>Fee Status</h2>
      <ul>
        {fees.map(fee => (
          <li key={fee._id}>Semester: {fee.semester}, Status: {fee.status}</li>
        ))}
      </ul>

      {courses.length > 0 && (
        <>
          <h2>Semester 1 Courses</h2>
          <ul>
            {courses.map(course => (
              <li key={course._id}>{course.courseName}</li>
            ))}
          </ul>
        </>
      )}

      <h2>Attendance</h2>
      <ul>
        {attendance.map((record, idx) => (
          <li key={idx}>
            {new Date(record.date).toLocaleDateString()} - Course: {record.course} - Status: {record.status}
          </li>
        ))}
      </ul>

      <h2>Grades</h2>
      <ul>
        {grades.map(grade => (
          <li key={grade._id}>
            Semester: {grade.semester}, Course: {grade.course || grade.courseName}, Credit Hours: {grade.creditHours || 'N/A'},<br />
            Total Marks: {grade.totalMarks || 'N/A'}, Obtained: {grade.obtainedMarks || grade.marks}, Grade: {grade.grade}, Quality Points: {grade.qualityPoints || 'N/A'}
          </li>
        ))}
      </ul>

      {gpaData?.semesters?.length > 0 && (
        <>
          <h2>📊 GPA Summary</h2>
          <ul>
            {gpaData.semesters.map((s, idx) => (
              <li key={idx}>Semester {s.semester} — GPA: {s.gpa}</li>
            ))}
          </ul>
          <p><strong>Overall CGPA:</strong> {gpaData.cgpa}</p>
        </>
      )}

      <h2>📝 Leave Requests</h2>
      {leaves.length === 0 ? (
        <p>No leave requests yet.</p>
      ) : (
        <ul>
          {leaves.map(leave => (
            <li key={leave._id}>
              {leave.reason} — {new Date(leave.date).toLocaleDateString()} — {leave.approved ? '✅ Approved' : '⏳ Pending'}
            </li>
          ))}
        </ul>
      )}

      <StudentLeaveRequest />

      {hasAllGradesForSem1() && (
        <>
          <hr />
          <h2>🎓 Degree Certificate</h2>
          <button onClick={() => setShowCertificate(!showCertificate)}>
            {showCertificate ? 'Hide Certificate' : 'View Degree Certificate'}
          </button>
          {showCertificate && <DegreeCertificate studentDID={studentDID} />}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
*/