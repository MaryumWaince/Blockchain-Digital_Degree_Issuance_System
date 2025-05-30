// File: src/pages/RegisterFaculty.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css'; // ✅ Reuse shared styling

const RegisterFaculty = () => {
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
        body: JSON.stringify({ ...formData, userType: 'faculty' })
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Faculty registered successfully!');
        navigate('/login/faculty');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Server error during registration');
      console.error(err);
    }
  };

  return (
    <div className="register-container">
      <h2>Faculty Registration</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="cnic"
          placeholder="CNIC"
          value={formData.cnic}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
      </form>

      <div className="login-redirect">
        <p>Already registered?</p>
        <button onClick={() => navigate('/login/faculty')}>Go to Login</button>
      </div>
    </div>
  );
};

export default RegisterFaculty;
