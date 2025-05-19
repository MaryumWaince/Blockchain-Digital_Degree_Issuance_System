import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DegreeCertificate = ({ studentDID }) => {
  const [data, setData] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/degree/${studentDID}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching degree data:', err);
      }
    };
    if (studentDID) fetchData();
  }, [studentDID, backendUrl]);

  if (!data) return <div>Loading Degree Certificate...</div>;

  const { student, semesters = [], cgpa, resultDate, issueDate } = data;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h1 style={{ textAlign: 'center' }}>🎓 Degree Certificate</h1>

      <section>
        <h3>General Information</h3>
        <p><strong>Student DID:</strong> {student?.did || 'N/A'}</p>
        <p><strong>Name:</strong> {student?.name || 'N/A'}</p>
        <p><strong>Father Name:</strong> {student?.fatherName || 'N/A'}</p>
        <p><strong>Degree:</strong> {student?.degree || 'N/A'}</p>
        <p><strong>Batch:</strong> {student?.batch || 'N/A'}</p>
        <p><strong>CGPA:</strong> {cgpa || 'Not Available'}</p>
        <p><strong>Result Declaration Date:</strong> {resultDate || 'Not Available'}</p>
        <p><strong>Degree Issue Date:</strong> {issueDate || 'Not Available'}</p>
      </section>

      <hr />

      <section>
        <h3>📊 Semester-wise Results</h3>
        {semesters.length > 0 ? (
          semesters.map((sem, idx) => (
            <div key={idx} style={{ marginBottom: '30px' }}>
              <h4>Semester {sem.semester} — GPA: {sem.gpa}</h4>
              {Array.isArray(sem.courses) && sem.courses.length > 0 ? (
                <table border="1" cellPadding="5" width="100%">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Credit Hours</th>
                      <th>Total Marks</th>
                      <th>Obtained</th>
                      <th>Grade</th>
                      <th>Quality Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, i) => (
                      <tr key={i}>
                        <td>{c.courseName || '-'}</td>
                        <td>{c.creditHours || '-'}</td>
                        <td>{c.totalMarks || '-'}</td>
                        <td>{c.obtainedMarks || '-'}</td>
                        <td>{c.grade || '-'}</td>
                        <td>{c.qualityPoints || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No course data for this semester.</p>
              )}
            </div>
          ))
        ) : (
          <p>No semester data available.</p>
        )}
      </section>

      <hr />

      <section style={{ marginTop: '40px', textAlign: 'center' }}>
        <p>🖋️ <strong>Vice Chancellor Signature</strong></p>
        <p>🖋️ <strong>Governor Signature</strong></p>
        <p>📜 <strong>University Logo / Seal</strong></p>
      </section>
    </div>
  );
};

export default DegreeCertificate;