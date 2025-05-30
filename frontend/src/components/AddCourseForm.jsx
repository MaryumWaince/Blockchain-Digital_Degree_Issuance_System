
import React, { useState } from 'react';
import axios from 'axios';

const AddCourseForm = () => {
  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    creditHours: '',
    totalMarks: '',
    degree: '',
    semester: ''
  });
  const [status, setStatus] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('');

    try {
      const res = await axios.post(`${backendUrl}/api/courses/single`, {
        courseCode: form.courseCode,
        courseName: form.courseName, // ✅ Corrected here
        creditHours: Number(form.creditHours),
        totalMarks: Number(form.totalMarks),
        degree: form.degree,
        semester: Number(form.semester)
      });
      setStatus('✅ Course added successfully.');
      setForm({ courseCode: '', courseName: '', creditHours: '', totalMarks: '', degree: '', semester: '' });
    } catch (err) {
      setStatus(`❌ ${err.response?.data?.error || 'Error adding course.'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="course-form">
      <div className="form-row">
        <input type="text" name="courseCode" placeholder="Course Code" value={form.courseCode} onChange={handleChange} required />
        <input type="text" name="courseName" placeholder="Course Name" value={form.courseName} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <input type="number" name="creditHours" placeholder="Credit Hours" value={form.creditHours} onChange={handleChange} required />
        <input type="number" name="totalMarks" placeholder="Total Marks" value={form.totalMarks} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <input type="text" name="degree" placeholder="Degree (e.g. BSCS)" value={form.degree} onChange={handleChange} required />
        <input type="number" name="semester" placeholder="Semester (e.g. 1)" value={form.semester} onChange={handleChange} required />
      </div>
      <button type="submit" className="button-style">Add Course</button>
      {status && <p className="message-info">{status}</p>}
    </form>
  );
};

export default AddCourseForm;
