import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [showDashboards, setShowDashboards] = useState(false);

  return (
    <nav className="navbar">
      <h2 className="navbar-title">DIGITAL DEGREE ISSUANCE</h2>
      <div className="navbar-links">
        <Link to="/">HOME</Link>

        <div
          onMouseEnter={() => setShowDashboards(true)}
          onMouseLeave={() => setShowDashboards(false)}
          style={{ position: 'relative' }}
        >
          <button className="dropdown-btn">DASHBOARDS ▼</button>
          {showDashboards && (
            <div className="dropdown-menu">
              <Link to="/register/student">STUDENT</Link>
              <Link to="/register/faculty">FACULTY</Link>
              <Link to="/register/admin">ADMIN</Link>
              <Link to="/hod/approvals">HOD</Link>
            </div>
          )}
        </div>

        <Link to="/verify-degree">VERIFY DEGREE</Link>
      </div>
    </nav>
  );
};
export default Navbar; 