// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract DegreeSystem {
    struct Fee {
        uint8 semester;
        bool paid;
    }

    struct Attendance {
        string courseId;
        string status; // "present", "absent", "leave"
        uint256 timestamp;
    }

    struct Grade {
        string courseId;
        uint16 totalMarks;
        uint16 obtainedMarks;
        uint8 creditHours;
        string grade;
        uint8 qualityPoints;
    }

    struct Degree {
        bool issued;
        string pdfHash;
        string issuedOn;
        string vcSignature;
        string govSignature;
        bool rejected;
    }

    struct Student {
        string encryptedData;
        bool exists;
    }

    mapping(string => Student) public students;
    mapping(string => Fee[]) public studentFees;
    mapping(string => Attendance[]) public studentAttendance;
    mapping(string => Grade[]) public studentGrades;
    mapping(string => Degree) public issuedDegrees;

    // Degree hash verification mapping
    mapping(string => bytes32) private degreeHashes;

    address public admin;
    string public currentVCSignature;
    string public currentGovSignature;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Student Registration
    function registerStudent(string memory studentDID, string memory encryptedData) public onlyAdmin {
        require(!students[studentDID].exists, "Already registered");
        students[studentDID] = Student(encryptedData, true);
    }

    // Fee Recording
    function recordFee(string memory studentDID, uint8 semester) public onlyAdmin {
        studentFees[studentDID].push(Fee(semester, true));
    }

    // Attendance Marking
    function markAttendance(string memory studentDID, string memory courseId, string memory status) public onlyAdmin {
        studentAttendance[studentDID].push(Attendance(courseId, status, block.timestamp));
    }

    // Grade Submission
    function submitGrade(
        string memory studentDID,
        string memory courseId,
        uint16 totalMarks,
        uint16 obtainedMarks,
        uint8 creditHours,
        string memory grade,
        uint8 qualityPoints
    ) public onlyAdmin {
        studentGrades[studentDID].push(Grade(courseId, totalMarks, obtainedMarks, creditHours, grade, qualityPoints));
    }

    // Signatures Update
    function storeSignatures(string memory vc, string memory gov) public onlyAdmin {
        currentVCSignature = vc;
        currentGovSignature = gov;
    }

    // Degree Rejection
    function rejectDegree(string memory studentDID) public onlyAdmin {
        require(issuedDegrees[studentDID].issued, "Degree not issued yet");
        issuedDegrees[studentDID].rejected = true;
        issuedDegrees[studentDID].issued = false;
    }

    // Degree Issuance
    function issueDegree(string memory studentDID, string memory pdfHash, string memory date) public onlyAdmin {
        require(students[studentDID].exists, "Student not found");
        require(!issuedDegrees[studentDID].issued || issuedDegrees[studentDID].rejected, "Already issued and not rejected");

        issuedDegrees[studentDID] = Degree({
            issued: true,
            pdfHash: pdfHash,
            issuedOn: date,
            vcSignature: currentVCSignature,
            govSignature: currentGovSignature,
            rejected: false
        });
    }

    // Verification Hash Storage
    function storeDegreeHash(string memory studentDID, bytes32 degreeHash) public onlyAdmin {
        degreeHashes[studentDID] = degreeHash;
    }

    // Verification Hash Retrieval
    function getDegreeHash(string memory studentDID) public view returns (bytes32) {
        return degreeHashes[studentDID];
    }

    // Full Student Status
    function getStudentStatus(string memory studentDID) public view returns (
        string memory,
        bool,
        Fee[] memory,
        Attendance[] memory,
        Grade[] memory,
        Degree memory,
        bytes32
    ) {
        return (
            students[studentDID].encryptedData,
            students[studentDID].exists,
            studentFees[studentDID],
            studentAttendance[studentDID],
            studentGrades[studentDID],
            issuedDegrees[studentDID],
            degreeHashes[studentDID]
        );
    }
}
