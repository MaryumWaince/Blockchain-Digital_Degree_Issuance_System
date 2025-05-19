// ✅ File: src/components/FacultyScheduleChange.jsx
import React, { useState } from 'react';

const FacultyScheduleChange = () => {
  const [formData, setFormData] = useState({
    facultyName: '',
    classId: '',
    oldDate: '',
    newDate: '',
    reason: ''
  });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('/api/schedule/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <h3>Class Schedule Change Request</h3>
      <input name="facultyName" placeholder="Faculty Name" onChange={handleChange} required />
      <input name="classId" placeholder="Class ID" onChange={handleChange} required />
      <input name="oldDate" type="date" onChange={handleChange} required />
      <input name="newDate" type="date" onChange={handleChange} required />
      <input name="reason" placeholder="Reason for change" onChange={handleChange} required />
      <button type="submit">Submit Request</button>
    </form>
  );
};

export default FacultyScheduleChange;
