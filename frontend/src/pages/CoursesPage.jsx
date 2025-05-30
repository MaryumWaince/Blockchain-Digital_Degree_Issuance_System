// src/components/CoursesPage.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const CoursesPage = () => {
  const [searchParams] = useSearchParams();
  const did = searchParams.get('did');

  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSem, setActiveSem] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchStudentAndCourses = async () => {
      try {
        // Fetch student details
        const studentRes = await axios.get(`${backendUrl}/api/students/${did}`);
        const studentData = studentRes.data;
        setStudent(studentData);

        // Fetch paid semesters
        const feesRes = await axios.get(`${backendUrl}/api/fees/${did}`);
        const paidSemesters = feesRes.data
          .filter(f => f.status === 'paid')
          .map(f => Number(f.semester));

        // Fetch courses for each paid semester
        const allCourses = [];
        for (let sem of paidSemesters) {
          const courseRes = await axios.get(`${backendUrl}/api/courses/${studentData.degree}/${sem}`);
          courseRes.data.forEach(course => {
            allCourses.push({ ...course, semester: sem });
          });
        }

        setCourses(allCourses);
        setActiveSem(paidSemesters[0] || 1);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err.message);
        setLoading(false);
      }
    };

    if (did) {
      fetchStudentAndCourses();
    }
  }, [did]);

  if (!did) return <p style={{ color: 'red' }}>❌ No student DID provided in URL.</p>;
  if (loading) return <p>Loading courses...</p>;

  const semesters = [...new Set(courses.map(c => c.semester))];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>📚 Enrolled Courses</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {semesters.map(sem => (
          <button
            key={sem}
            onClick={() => setActiveSem(sem)}
            style={{
              padding: '6px 12px',
              background: sem === activeSem ? '#0366d6' : '#eee',
              color: sem === activeSem ? '#fff' : '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Semester {sem}
          </button>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Course ID</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Course Name</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Credit Hours</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Semester</th>
          </tr>
        </thead>
        <tbody>
          {courses
            .filter(c => c.semester === activeSem)
            .map((c, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.courseCode}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.courseName || c.name}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.creditHours}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.semester}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoursesPage;
