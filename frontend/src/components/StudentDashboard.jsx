import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DegreeCertificate from './DegreeCertificate';
import '../styles/StudentDashboard.css';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [degreeStatus, setDegreeStatus] = useState(null);
  const [degreeHash, setDegreeHash] = useState('');
  const [showDegree, setShowDegree] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [notificationDegree, setNotificationDegree] = useState(null);

  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const fetchDegreeStatus = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/degree-request/${studentDID}`);
      const requestStatus = res.data;
      setDegreeStatus(requestStatus);

      const degreeRes = await axios.get(`${backendUrl}/api/degree/issued/${studentDID}`);
      const degreeData = degreeRes.data;

      if (degreeData && degreeData.status === 'Issued') {
        setDegreeStatus(prev => ({ ...prev, ...degreeData }));
        if (degreeData.notification) {
          setNotificationDegree(degreeData);
        }

        const hashRes = await axios.get(`${backendUrl}/api/degree/hash/${studentDID}`);
        if (hashRes.data && hashRes.data.hash) {
          setDegreeHash(hashRes.data.hash);
        }
      }
    } catch (err) {
      console.error('Error fetching degree status/hash:', err);
      setDegreeStatus(null);
    }
  };

  const handleDownloadNotificationDegree = async () => {
    window.open(`https://ipfs.io/ipfs/${notificationDegree.ipfsHash}`, '_blank');
    await axios.post(`${backendUrl}/api/degree/notification/read`, {
      studentDID: studentDID,
    });
    setNotificationDegree(null);
    await fetchDegreeStatus();
  };

  useEffect(() => {
    if (!studentDID) {
      setError('Student DID not found. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/students/${studentDID}`);
        setStudentData(res.data);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to fetch student data.');
      }
    };

    setLoading(true);
    fetchStudentData();
    fetchDegreeStatus().finally(() => setLoading(false));
  }, [studentDID, backendUrl]);

  const applyForDegree = async () => {
    if (applying) return;
    setApplying(true);
    setMessage('');
    try {
      const res = await axios.post(`${backendUrl}/api/degree-request`, { studentDID });
      setMessage(res.data.message);
      await fetchDegreeStatus();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to apply for degree.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="student-dashboard">
      <h1 className="dashboard-heading">🎓 Student Dashboard</h1>

      {/* 🔔 Notification Box */}
    {notificationDegree && (
  <div className="bg-blue-100 border border-blue-300 text-blue-800 p-4 rounded mb-4">
    🎉 <strong>Degree Issued:</strong> You can now download your official degree certificate.

    <div className="mt-3 space-y-2">
      <button
        onClick={handleDownloadNotificationDegree}
        className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        📥 Download Degree Notification (IPFS)
      </button>
    </div>
  </div>
)}


      {/* Personal Info */}
      <section className="section personal-info-container">
        <h2 className="centered-heading">👤 Personal Information</h2>
        <div className="info-box">
          <table className="info-table">
            <tbody>
              <tr><td><strong>Name:</strong></td><td>{studentData?.name}</td></tr>
              <tr><td><strong>CNIC:</strong></td><td>{studentData?.cnic}</td></tr>
              <tr><td><strong>Contact:</strong></td><td>{studentData?.contact}</td></tr>
              <tr><td><strong>Email:</strong></td><td>{studentData?.email}</td></tr>
              <tr><td><strong>Degree:</strong></td><td>{studentData?.degree}</td></tr>
              <tr><td><strong>Batch:</strong></td><td>{studentData?.batch}</td></tr>
              <tr><td><strong>DID:</strong></td><td>{studentData?.did}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="section"><h2><Link to={`/student/fees?did=${studentDID}`} className="section-link">💳 Fee Status ▶️</Link></h2></section>
      <section className="section"><h2><Link to={`/student/courses?did=${studentDID}`} className="section-link">📚 Enrolled Courses ▶️</Link></h2></section>
      <section className="section"><h2><Link to={`/attendance?did=${studentDID}`} className="section-link">📅 Attendance ▶️</Link></h2></section>
      <section className="section"><h2><Link to={`/student/grades?did=${studentDID}`} className="section-link">📈 Academics ▶️</Link></h2></section>
      <section className="section"><h2><Link to={`/student/leaves?did=${studentDID}`} className="section-link">📝 Leave Requests ▶️</Link></h2></section>
      <section className="section"><h2><Link to={`/student/reenrollment`} className="section-link">🔄 Re-enrollment ▶️</Link></h2></section>

      {/* Degree Issuance Section */}
      <section className="section">
        <h2 className="centered-heading">🎓 Degree Issuance</h2>

        {!degreeStatus || !degreeStatus.status ? (
          <button onClick={applyForDegree} className="btn-apply-degree" disabled={applying}>
            {applying ? 'Applying...' : 'Apply for Degree Issuance'}
          </button>
        ) : (
          <div className="degree-status-box">
            <p><strong>Status:</strong> {degreeStatus.status}</p>

            {degreeStatus.remark && (
              <p className="error"><strong>Remark:</strong> {degreeStatus.remark}</p>
            )}

            {degreeStatus.status === 'Rejected' && (
              <button onClick={applyForDegree} className="btn-apply-degree" disabled={applying}>
                {applying ? 'Re-applying...' : 'Re-Apply for Degree'}
              </button>
            )}

            {(degreeStatus.status === 'Issued' || degreeStatus.status === 'Approved') && degreeStatus.pdfUrl && (
              <a
                href={degreeStatus.pdfUrl.startsWith('http') ? degreeStatus.pdfUrl : `${backendUrl}${degreeStatus.pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download-degree"
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                📥 View / Download Degree PDF
              </a>
            )}

            {degreeHash && (
              <p className="mt-2">
                <strong>🔗 Degree Hash (IPFS/Blockchain):</strong><br />
                <code className="text-xs break-all">{degreeHash}</code>
              </p>
            )}
          </div>
        )}

        {message && <p className="text-red-500 mt-2">{message}</p>}
      </section>

      {/* Degree Status Overview */}
      {degreeStatus && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">🎓 Degree Status</h2>
          <p className="mb-1"><strong>Status:</strong> {degreeStatus.status}</p>

          {degreeStatus.status === 'Rejected' && (
            <p className="text-red-600">❌ Degree Request Rejected — {degreeStatus.remark || 'No remark provided'}</p>
          )}
          {degreeStatus.status === 'Pending' && (
            <p className="text-yellow-600">⏳ Degree Request Pending Review</p>
          )}
          {degreeStatus.status === 'Issued' && (
            <p className="text-green-600">✅ Degree has been officially issued.</p>
          )}
        </div>
      )}

      {/* Degree Certificate Preview */}
      <section className="section">
        <button onClick={() => setShowDegree(!showDegree)} className="btn-toggle-degree">
          {showDegree ? 'Hide' : 'Show'} Degree Certificate
        </button>
        {showDegree && <DegreeCertificate studentDID={studentDID} />}
      </section>
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