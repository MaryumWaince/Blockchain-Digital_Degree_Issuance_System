import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Register.css'; 

const Register = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const endpoint = role === 'student' ? '/api/students/register' : '/api/user/register';
    const payload = role === 'student'
      ? formData
      : { name: formData.name, cnic: formData.cnic, userType: role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (role === 'student') {
          const data = await res.json();
          const did = data.did;
          const privateKey = data.privateKey;

          localStorage.setItem(`privateKey-${did}`, privateKey);
          localStorage.setItem('user', JSON.stringify({ did }));
        }
        navigate(`/login/${role}`);
      } else {
        const error = await res.json();
        alert(error.message || 'Registration failed');
      }
    } catch (err) {
      alert('An error occurred during registration');
      console.error(err);
    }
  };

  const handleLoginRedirect = () => {
    navigate(`/login/${role}`);
  };

  return (
    <div className="register-container">
      <h2>{role.charAt(0).toUpperCase() + role.slice(1)} Registration</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="cnic" placeholder="CNIC" onChange={handleChange} required />
        {role === 'student' && (
          <>
            <input name="email" placeholder="Email" onChange={handleChange} required />
            <input name="contact" placeholder="Contact" onChange={handleChange} required />
            <select name="degree" onChange={handleChange} required>
              <option value="">Select Degree</option>
              <option value="BSCS">BS Computer Science</option>
              <option value="BSSE">BS Software Engineering</option>
              <option value="BSIT">BS Information Technology</option>
              <option value="BSDS">BS Data Science</option>
              <option value="BSIS">BS Information Security</option>
              <option value="BSAI">BS Artificial Intelligence</option>
              <option value="BSE">BS Electronics</option>
              <option value="BSCN">BS Cybersecurity</option>
              <option value="BSEM">BS Environmental Management</option>
              <option value="BSMath">BS Mathematics</option>
            </select>
            <input name="batch" placeholder="Batch No." onChange={handleChange} required />
          </>
        )}
        <button type="submit">Register</button>
      </form>

      {role === 'student' && (
        <div className="login-redirect">
          <p>Already registered?</p>
          <button onClick={handleLoginRedirect}>Go to Login</button>
        </div>
      )}
    </div>
  );
};

export default Register;
