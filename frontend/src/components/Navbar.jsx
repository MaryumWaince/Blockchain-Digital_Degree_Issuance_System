// File: src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="navbar-title">Digital Degree Issuance</h2>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/register/student">Student Dashboard</Link>
        <Link to="/register/faculty">Faculty Dashboard</Link> {/* ✅ Go to registration first */}
        <Link to="/register/admin">Admin Dashboard</Link>     {/* ✅ Go to registration first */}
        <Link to="/hod/approvals">HOD Dashboards</Link>

      </div>
    </nav>
  );
};

export default Navbar;
