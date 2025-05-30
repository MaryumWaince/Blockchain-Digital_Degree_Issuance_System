import React, { useEffect, useState } from 'react';
import axios from 'axios';

const GradesPage = ({ studentDID }) => {
  const [data, setData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1); // Default to Semester 1
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/degree/academic/${studentDID}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching degree data:', err);
      }
    };
    if (studentDID) fetchData();
  }, [studentDID, backendUrl]);

  if (!data) return <div>Loading Degree Certificate...</div>;

  const { semesters = [] } = data;
  const selectedData = semesters.find(s => Number(s.semester) === Number(selectedSemester));

  // Calculate CGPA: sum of qualityPoints / sum of creditHours
  const calculateCGPA = () => {
    let totalQualityPoints = 0;
    let totalCreditHours = 0;

    semesters.forEach(sem => {
      sem.courses?.forEach(course => {
        if (course.qualityPoints && course.creditHours) {
          totalQualityPoints += Number(course.qualityPoints);
          totalCreditHours += Number(course.creditHours);
        }
      });
    });

    return totalCreditHours > 0 ? (totalQualityPoints / totalCreditHours).toFixed(2) : 'N/A';
  };

  return (
    <div style={{ padding: '50px', maxWidth: '1000px', margin: 'auto', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h1 style={{ textAlign: 'center' }}>🎓 Academic Record</h1>

      {/* Semester Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[...Array(8)].map((_, i) => {
          const sem = i + 1;
          return (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              style={{
                margin: '5px',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #888',
                backgroundColor: selectedSemester === sem ? '#007bff' : '#f0f0f0',
                color: selectedSemester === sem ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Semester {sem}
            </button>
          );
        })}
      </div>

      {/* Selected Semester Data */}
      <section>
        <h3>📊 Semester {selectedSemester} — GPA: {selectedData?.gpa || 'N/A'}</h3>
        {selectedData?.courses?.length > 0 ? (
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
              {selectedData.courses.map((c, i) => (
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
      </section>

      <hr />

      {/* CGPA Section */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <h3>📈 Cumulative GPA (CGPA): {calculateCGPA()}</h3>
      </div>
    </div>
  );
};

export default GradesPage;


/*
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const GradesPage = ({ studentDID }) => {
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchGradesAndCourses = async () => {
      try {
        const [gradesRes, coursesRes] = await Promise.all([
          axios.get(`${backendUrl}/api/grades/${studentDID}`),
          axios.get(`${backendUrl}/api/courses`)
        ]);
        setGrades(gradesRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error('Error fetching grades or courses:', err);
      }
    };

    if (studentDID) {
      fetchGradesAndCourses();
    }
  }, [studentDID, backendUrl]);

  const enrichedGrades = grades.map((grade) => {
    const course = courses.find(c => c.courseCode === grade.course);
    return {
      ...grade,
      courseName: course?.courseName || 'N/A',
      creditHours: course?.creditHours || 'N/A',
      totalMarks: course?.totalMarks || 'N/A',
      semester: course?.semester || 'N/A'
    };
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2 style={{ textAlign: 'center' }}>📚 Student Grades</h2>

      {enrichedGrades.length > 0 ? (
        <table border="1" cellPadding="5" width="100%" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Semester</th>
              <th>Credit Hours</th>
              <th>Total Marks</th>
              <th>Obtained Marks</th>
              <th>Grade</th>
              <th>Quality Points</th>
            </tr>
          </thead>
          <tbody>
            {enrichedGrades.map((grade, idx) => (
              <tr key={idx}>
                <td>{grade.course}</td>
                <td>{grade.courseName}</td>
                <td>{grade.semester}</td>
                <td>{grade.creditHours}</td>
                <td>{grade.totalMarks}</td>
                <td>{grade.obtainedMarks}</td>
                <td>{grade.grade}</td>
                <td>{grade.qualityPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No grades available yet.</p>
      )}
    </div>
  );
};

export default GradesPage;
*/

/*
import { useEffect, useState } from 'react';
import axios from 'axios';

const GPAOverviewPage = () => {
  const [gpaData, setGpaData] = useState([]);
  const studentDID = JSON.parse(localStorage.getItem('user'))?.did;
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    axios.get(`${backendUrl}/api/gpa/${studentDID}`).then(res => setGpaData(res.data));
  }, [studentDID]);

  return (
    <div>
      <h2>📊 GPA Overview</h2>
      <ul>
        {gpaData.map((entry) => (
          <li key={entry._id}>
            Semester: {entry.semester}, GPA: {entry.gpa}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GPAOverviewPage;
*/