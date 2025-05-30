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
    <form onSubmit={handleSubmit} style={formStyle}>
      

      <div style={horizontalRow}>
        <input
          name="facultyName"
          placeholder="Faculty Name"
          onChange={handleChange}
          required
          style={smallInput}
        />
        <input
          name="classId"
          placeholder="Class ID"
          onChange={handleChange}
          required
          style={smallInput}
        />
        <input
          name="oldDate"
          type="date"
          onChange={handleChange}
          required
          style={smallInput}
        />
        <input
          name="newDate"
          type="date"
          onChange={handleChange}
          required
          style={smallInput}
        />
        <input
          name="reason"
          placeholder="Reason"
          onChange={handleChange}
          required
          style={smallInput}
        />
        <button type="submit" style={smallButton}>Submit Request</button>
      </div>
    </form>
  );
};

// ✅ Inline styles for horizontal layout
const formStyle = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  marginTop: '20px',
  maxWidth: '100%',
  overflowX: 'auto'
};


const horizontalRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
};

const smallInput = {
  padding: '8px',
  fontSize: '0.9rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
  width: '150px'
};

const smallButton = {
  backgroundColor: '#0366d6',
  color: '#fff',
  padding: '8px 14px',
  fontSize: '0.9rem',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

export default FacultyScheduleChange;
