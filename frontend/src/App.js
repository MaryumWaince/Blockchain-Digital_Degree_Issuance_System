// src/App.js
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './components/StudentDashboard';

import RegisterFaculty from './pages/RegisterFaculty';
import RegisterAdmin from './pages/RegisterAdmin';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';

import StudentLeaveRequest from './components/StudentLeaveRequest';
import HODScheduleDashboard from './components/HODScheduleDashboard';
import DegreeCertificate from './components/DegreeCertificate';

import GradesPage from './pages/GradesPage';
import AttendancePage from './pages/AttendancePage';
import CoursesPage from './pages/CoursesPage';
import FeeStatusPage from './pages/FeeStatusPage';
import ReEnrollmentPage from './pages/ReEnrollmentPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import SignaturePage from './pages/SignaturePage';
import DegreeUploader from './components/DegreeUploader';

import VerifyDegree from './components/VerifyDegree';


// Wrapper to extract studentDID from route param
const DegreeCertificateWrapper = () => {
  const { studentDID } = useParams();
  return <DegreeCertificate studentDID={studentDID} />;
};

function App() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/:role" element={<Register />} />
          <Route path="/login/:role" element={<Login />} />

          <Route path="/register/faculty" element={<RegisterFaculty />} />
          <Route path="/register/admin" element={<RegisterAdmin />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/student/leave" element={<StudentLeaveRequest />} />
          <Route path="/hod/approvals" element={<HODScheduleDashboard />} />
          <Route path="/degree/:studentDID" element={<DegreeCertificateWrapper />} />

          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/student/courses" element={<CoursesPage />} />
          <Route path="/student/fees" element={<FeeStatusPage />} />
          <Route path="/student/reenrollment" element={<ReEnrollmentPage />} />
          <Route path="/student/leaves" element={<LeaveRequestsPage />} />
          <Route path="/signature" element={<SignaturePage />} />
          <Route
            path="/student/grades"
            element={<GradesPage studentDID={localStorage.getItem('studentDID')} />}
          />
          <Route path="/upload-degree" element={<DegreeUploader />} />

          <Route path="/verify-degree" element={<VerifyDegree />} />

        </Routes>
      </div>
    </>
  );
}

export default App;
