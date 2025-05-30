
/*
import { useState, useEffect } from 'react';
import axios from 'axios';

const ReEnrollmentForm = () => {
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [message, setMessage] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;

  useEffect(() => {
    const fetchRequests = async () => {
      if (!studentDID) return;
      try {
        const res = await axios.get(`${backendUrl}/api/reenrollments/student/${studentDID}`);
        setSubmittedRequests(res.data);
      } catch (error) {
        console.error('Error fetching re-enrollment requests', error);
      }
    };

    fetchRequests();
  }, [studentDID, backendUrl]);

  const fetchCourses = async (selectedSemester) => {
    try {
      const studentRes = await axios.get(`${backendUrl}/api/students/${studentDID}`);
      const degree = studentRes.data.degree;
      const res = await axios.get(`${backendUrl}/api/courses/${degree}/${selectedSemester}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err.message);
    }
  };

  const handleSemesterChange = async (e) => {
    const value = e.target.value;
    setSemester(value);
    setSelectedCourses([]);
    await fetchCourses(value);
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!semester || selectedCourses.length === 0) {
      setMessage('❗ Please select a semester and at least one course.');
      return;
    }

    try {
      await axios.post(`${backendUrl}/api/reenrollments/request`, {
        studentDID,
        semester,
        courses: selectedCourses,
      });
      setMessage('✅ Request submitted successfully!');
      setSemester('');
      setCourses([]);
      setSelectedCourses([]);
    } catch (error) {
      setMessage('❌ Error submitting request.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 font-medium';
      case 'rejected':
        return 'text-red-600 font-medium';
      default:
        return 'text-yellow-600 font-medium';
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h2 className="text-xl font-semibold">🔁 Re-Enrollment Request</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-2">
          <label className="block mb-1 font-medium">Semester</label>
          <input
            type="number"
            min="1"
            max="8"
            value={semester}
            onChange={handleSemesterChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {courses.length > 0 && (
          <div className="mb-3">
            <label className="block mb-1 font-medium">Select Courses</label>
            {courses.map((course) => (
              <div key={course._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course._id)}
                  onChange={() => handleCourseSelect(course._id)}
                  className="mr-2"
                />
                <span>{course.courseName}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          Submit Request
        </button>

        {message && <p className="mt-2 text-sm font-medium">{message}</p>}
      </form>

      {submittedRequests.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">📋 Your Requests</h3>
          <ul className="space-y-4">
            {submittedRequests.map((req) => (
              <li
                key={req._id}
                className="border rounded p-3 bg-gray-50 shadow-sm"
              >
                <div className="mb-1">
                  <strong>Semester:</strong> {req.semester}
                </div>
                <div className="mb-1">
                  <strong>Status:</strong>{' '}
                  <span className={getStatusStyle(req.status)}>
                    {req.status === 'approved'
                      ? '✅ Approved'
                      : req.status === 'rejected'
                      ? '❌ Rejected'
                      : '⏳ Pending'}
                  </span>
                </div>
                {req.courses?.length > 0 && (
                  <div>
                    <strong>Courses:</strong>
                    <ul className="list-disc list-inside">
                      {req.courses.map((course) => (
                        <li key={course._id || course}>{course.courseName || course}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReEnrollmentForm;
*/
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReEnrollmentForm = () => {
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(null);

  const studentDID = localStorage.getItem('studentDID');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!studentDID) {
      setError('Student DID not found. Please log in again.');
      return;
    }

    const fetchLatestRequest = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/reenrollment/student/${studentDID}`);
        const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (sorted.length > 0) {
          setLatest(sorted[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLatestRequest();
  }, [studentDID, backendUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentDID) {
      setError('Student DID not found. Please log in again.');
      return;
    }

    try {
      const courseList = courses
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c !== '')
        .map((courseName) => ({ courseName }));

      await axios.post(`${backendUrl}/api/reenrollment`, {
        studentDID,
        semester: parseInt(semester),
        reason,
        courses: courseList,
      });

      setMessage('✅ Re-enrollment request submitted successfully.');
      setError('');
      setCourses('');
      setReason('');
      setSemester('');
    } catch (err) {
      console.error(err);
      setError('❌ Error submitting re-enrollment request.');
      setMessage('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        📚 <span className="ml-2">Re-Enrollment Request</span>
      </h2>

      {latest && (
        <p className="text-sm text-gray-600 mb-6">
          <strong>Last Submitted:</strong>{' '}
          {latest.createdAt && !isNaN(Date.parse(latest.createdAt))
            ? new Date(latest.createdAt).toLocaleDateString()
            : 'Not Available'}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Semester Number:</label>
          <input
            type="number"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 4"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Courses (comma-separated):</label>
          <textarea
            value={courses}
            onChange={(e) => setCourses(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="e.g., Data Structures, DBMS"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Reason:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Explain your reason for re-enrollment"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition duration-300"
        >
          Submit Request
        </button>
      </form>

      {message && <p className="mt-6 text-green-600 font-semibold text-center">{message}</p>}
      {error && <p className="mt-6 text-red-600 font-semibold text-center">{error}</p>}
    </div>
  );
};

export default ReEnrollmentForm;
