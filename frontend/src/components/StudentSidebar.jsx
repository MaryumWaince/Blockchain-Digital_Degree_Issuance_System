import { Link } from 'react-router-dom';

const StudentSidebar = () => (
  <div style={{ width: '250px', padding: '1rem', backgroundColor: '#f5f5f5' }}>
    <h3>Dashboard Menu</h3>
    <ul>
      <li><Link to="/student/grades">Grades</Link></li>
      <li><Link to="/student/attendance">Attendance</Link></li>
      <li><Link to="/student/courses">Courses</Link></li>
      <li><Link to="/student/leaves">Leave Requests</Link></li>
      <li><Link to="/student/fees">Fee Status</Link></li>
      <li><Link to="/student/gpa">GPA Overview</Link></li>
      <li><Link to="/student/reenrollment">Re-Enrollment</Link></li>
    </ul>
  </div>
);

export default StudentSidebar;
