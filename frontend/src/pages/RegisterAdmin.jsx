// File: src/pages/RegisterAdmin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', cnic: '' });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userType: 'admin' })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Admin registered successfully!');
        navigate('/login/admin');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Server error during registration');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Admin Registration</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="cnic" placeholder="CNIC" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>

      {/* ✅ Already Registered Button */}
      <p style={{ marginTop: '15px' }}>
        Already registered?{' '}
        <button onClick={() => navigate('/login/admin')}>Go to Login</button>
      </p>
    </div>
  );
};

export default RegisterAdmin;
