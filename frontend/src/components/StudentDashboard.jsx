import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentDID = localStorage.getItem('studentDID');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentDID) throw new Error('Student DID not found. Please log in again.');
        
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

        // Fetch Student Data
        const studentResponse = await axios.get(`${backendUrl}/api/students/${studentDID}`);
        if (studentResponse.status === 200) {
          setStudentData(studentResponse.data);
        } else {
          throw new Error(studentResponse.data.message || 'Failed to fetch student data');
        }

        // Fetch Attendance
        const attendanceResponse = await axios.get(`${backendUrl}/api/attendance/${studentDID}`);
        setAttendance(attendanceResponse.data || []);

        // Fetch Grades
        const gradesResponse = await axios.get(`${backendUrl}/api/grades/${studentDID}`);
        setGrades(gradesResponse.data || []);

        // Fetch Fee Status
        const feesResponse = await axios.get(`${backendUrl}/api/fees/${studentDID}`);
        setFees(feesResponse.data || []);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [studentDID]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Student Dashboard</h1>
      <h2>Personal Information</h2>
      <p>Name: {studentData?.name}</p>
      <p>CNIC: {studentData?.cnic}</p>
      <p>Contact No: {studentData?.contactNo}</p>
      <p>Email: {studentData?.email}</p>
      <p>Degree: {studentData?.degree}</p>
      <p>Batch: {studentData?.batch}</p>
      <p>DID: {studentData?.did}</p>

      <h2>Fee Status</h2>
      <ul>
        {fees.map(fee => (
          <li key={fee._id}>
            Semester: {fee.semester}, Status: {fee.status}
          </li>
        ))}
      </ul>

      <h2>Attendance Records</h2>
      <ul>
        {attendance.map(record => (
          <li key={record._id}>
            Date: {new Date(record.date).toLocaleDateString()}, Status: {record.status}
          </li>
        ))}
      </ul>

      <h2>Grades</h2>
      <ul>
        {grades.map(grade => (
          <li key={grade._id}>
            Course: {grade.course}, Semester: {grade.semester}, Grade: {grade.grade}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentDashboard;

