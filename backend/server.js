const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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
const userRoutes = require('./routes/userRoutes'); // ✅ Add this near the top

const leaveRoutes = require('./routes/leaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const reenrollmentRoutes = require('./routes/reenrollmentRoutes');





const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000', // adjust if frontend is hosted elsewhere
  credentials: true
}));
app.use(express.json());

// ✅ API Routes
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/degree', degreeRoutes); // ✅ Fix applied here
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/reenrollment', reenrollmentRoutes);



// ✅ Global Error Handler
app.use(errorHandler);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
