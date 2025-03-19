import React, { useState } from 'react';
import axios from 'axios';

const StudentSection = () => {
  const [view, setView] = useState('register');
  const [formData, setFormData] = useState({
    name: '', cnic: '', contactNo: '', email: '', degree: '', batch: ''
  });
  const [did, setDID] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [challenge, setChallenge] = useState('randomChallenge');
  const [zkp, setZKP] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/register`, formData);
      alert(response.data.message);
      setDID(response.data.did);
      setPrivateKey(response.data.privateKey);
    } catch (error) {
      alert('Registration failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/generate-zkp`, { privateKey, challenge });
      setZKP(data.zkp);

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/verify-zkp`, { did, zkp: data.zkp, challenge });
      alert(response.data.message);
      
      if (response.data.message === "ZKP Authentication Successful") {
        localStorage.setItem('studentDID', did);
        window.location.href = '/student-dashboard';
      }
    } catch (error) {
      alert('Authentication failed');
    }
  };

  return (
    <div>
      {view === 'register' ? (
        <div>
          <h1>Student Registration</h1>
          <form onSubmit={handleRegister}>
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                name={key}
                placeholder={key}
                onChange={handleChange}
              />
            ))}
            <button type="submit">Register</button>
          </form>
          <button onClick={() => setView('login')}>Switch to Login</button>
        </div>
      ) : (
        <div>
          <h1>Student Login</h1>
          <input placeholder="DID" value={did} onChange={(e) => setDID(e.target.value)} />
          <input placeholder="Private Key" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
          <button onClick={() => setView('register')}>Switch to Register</button>
        </div>
      )}
    </div>
  );
};

export default StudentSection;
