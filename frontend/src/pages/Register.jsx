import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', cnic: '', contactNo: '', email: '', degree: '', batch: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/students/register`, formData);
      alert(response.data.message);
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="cnic" placeholder="CNIC" onChange={handleChange} />
      <input name="contactNo" placeholder="Contact No" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="degree" placeholder="Degree" onChange={handleChange} />
      <input name="batch" placeholder="Batch" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
