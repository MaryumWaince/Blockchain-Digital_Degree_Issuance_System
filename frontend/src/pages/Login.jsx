import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [did, setDID] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [challenge, setChallenge] = useState('randomChallenge');
  const [zkp, setZKP] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/generate-zkp`, { privateKey, challenge });
      setZKP(data.zkp);

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/verify-zkp`, { did, zkp: data.zkp, challenge });
      alert(response.data.message);
    } catch (error) {
      alert('Authentication failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="DID" value={did} onChange={(e) => setDID(e.target.value)} />
      <input placeholder="Private Key" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
