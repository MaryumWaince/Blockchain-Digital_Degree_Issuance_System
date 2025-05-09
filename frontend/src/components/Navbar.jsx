// File: src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // ✅ Import the external CSS file

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="navbar-title">Digital Degree Issuance</h2>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/register/student">Student Dashboard</Link>
        <Link to="/login/faculty">Faculty Dashboard</Link>
        <Link to="/login/admin">Admin Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
