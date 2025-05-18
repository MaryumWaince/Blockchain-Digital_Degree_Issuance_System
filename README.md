# Blockchain-Digital_Degree_Issuance_System
 Overview
This project is a full-stack decentralized academic records management platform that securely handles student registration, attendance, grades, fees, leave requests, and degree issuance. It utilizes DID-based login for students, faculty/admin roles for academic operations, and is designed to support future smart contract integration.

#🚀 Features
👨‍🎓 Student Portal
DID-based authentication (using private key)

Dashboard with:

Personal info

Semester-wise grades

Attendance records

Fee status

GPA and CGPA calculation

Leave request submission

Degree certificate viewer (with dynamic data)

👩‍🏫 Faculty Portal
Faculty login via CNIC

Mark attendance

Submit grades

View student leave requests

🧑‍💼 Admin Portal
Admin login via CNIC

Verify fees

Monitor degree issuance status

Confirm signatures on certificates

📚 Academic Modules
Courses assigned per degree and semester

Automatic grade calculation with credit hour and quality points

Semester GPA and CGPA computation

🔐 Security & Authentication
DID (Decentralized Identifier) login for students

Private key-based verification

(Planned) MetaMask/digital wallet support

🏗️ Tech Stack
Layer	Technology
Frontend	React.js, Axios
Backend	Node.js, Express.js
Database	MongoDB
Blockchain	Ethereum + Solidity (future)
Auth	DID, Private Key
Styling	(Pending) Tailwind CSS / Bootstrap

📦 Folder Structure
bash:
/backend
  /models        → Mongoose models
  /routes        → Express route files
  /controllers   → Route logic
  /config        → MongoDB connection
  /middleware    → Error handling, auth
/frontend
  /components    → Dashboards, reusable components
  /pages         → Login/Register/Home
.env             → Backend and frontend URLs
📝 Installation Instructions
1. Clone the Repository
bash:
git clone https://github.com/your-username/blockchain-degree-system.git
cd blockchain-degree-system
2. Setup Backend
bash:
cd backend
npm install
npm run dev
3. Setup Frontend
bash:
cd frontend
npm install
npm start


