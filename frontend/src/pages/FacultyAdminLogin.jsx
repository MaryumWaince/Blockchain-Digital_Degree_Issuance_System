import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FacultyAdminLogin = ({ userType }) => {
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/faculty-admin/register`, { 
        name, cnic, userType 
      });
      alert(response.data.message || 'Registration Successful');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration Failed');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/faculty-admin/login`, { 
        cnic, userType 
      });

      if (response.data.userType === "Faculty") {
        localStorage.setItem('userType', 'Faculty');
        navigate('/faculty-dashboard');
      } else if (response.data.userType === "Admin") {
        localStorage.setItem('userType', 'Admin');
        navigate('/admin-dashboard');
      } else {
        alert('Invalid user type');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login Failed');
    }
  };

  return (
    <div>
      <h1>{userType} {isLogin ? 'Login' : 'Registration'}</h1>
      
      {!isLogin && (
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      
      <div>
        <input
          type="text"
          placeholder="CNIC"
          value={cnic}
          onChange={(e) => setCnic(e.target.value)}
        />
      </div>
      
      <div>
        <button onClick={isLogin ? handleLogin : handleRegister}>
          {isLogin ? 'Login' : 'Register'}
        </button>
        
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Switch to Registration' : 'Switch to Login'}
        </button>
      </div>
    </div>
  );
};

export default FacultyAdminLogin;

