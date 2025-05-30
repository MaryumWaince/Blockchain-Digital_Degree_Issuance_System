const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route Imports
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const courseRoutes = require('./routes/courseRoutes');
const degreeRoutes = require('./routes/degreeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const reenrollmentRoutes = require('./routes/reenrollmentRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const degreeRequestRoutes = require('./routes/degreeRequestRoutes');

const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/degree', degreeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/reenrollment', reenrollmentRoutes);
app.use('/api/signature', signatureRoutes);
app.use('/api/degree-request', degreeRequestRoutes);

//app.use('/api/degree-request', require('./routes/degreeRequest'));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/degree_pdfs', express.static(path.join(__dirname, 'degree_pdfs')));

// Optional manual file route
app.get('/degree_pdfs/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'degree_pdfs', req.params.filename);
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(404).send('File not found');
    }
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
