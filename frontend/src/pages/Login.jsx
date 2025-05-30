import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Login.css'; 


const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    did: '',
    privateKey: '',
    name: '',
    cnic: ''
  });

  const handleChange = e => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (role === 'student') {
      const storedPrivateKey = localStorage.getItem(`privateKey-${credentials.did}`);

      if (storedPrivateKey && storedPrivateKey === credentials.privateKey) {
        localStorage.setItem('user', JSON.stringify({ did: credentials.did }));
        alert('Login successful!');
        navigate('/student/dashboard');
      } else {
        alert('Invalid DID or Private Key. Please try again.');
      }
    } else {
      try {
        const res = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: credentials.name,
            cnic: credentials.cnic,
            userType: role
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('user', JSON.stringify(data));
        alert('Login successful!');
        navigate(`/${role}/dashboard`);
      } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>{role.charAt(0).toUpperCase() + role.slice(1)} Login</h2>
      {role === 'student' ? (
        <>
          <input
            name="did"
            placeholder="Enter your DID"
            value={credentials.did}
            onChange={handleChange}
            required
          />
          <input
            name="privateKey"
            placeholder="Enter your Private Key"
            value={credentials.privateKey}
            onChange={handleChange}
            required
          />
        </>
      ) : (
        <>
          <input
            name="name"
            placeholder="Enter your Name"
            value={credentials.name}
            onChange={handleChange}
            required
          />
          <input
            name="cnic"
            placeholder="Enter your CNIC"
            value={credentials.cnic}
            onChange={handleChange}
            required
          />
        </>
      )}
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
