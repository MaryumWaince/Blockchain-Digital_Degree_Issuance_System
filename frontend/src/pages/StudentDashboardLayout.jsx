import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';

const StudentDashboardLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <StudentSidebar />
      <div style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default StudentDashboardLayout;
