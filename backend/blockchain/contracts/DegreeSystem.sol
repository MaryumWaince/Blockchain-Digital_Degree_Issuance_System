// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract DegreeSystem {
    struct Degree {
        bool issued;
        string pdfHash;     // IPFS CID of the PDF
        string issuedOn;
        string vcSignature;
        bool rejected;
    }

    mapping(string => Degree) private issuedDegrees;
    mapping(string => bytes32) private degreeHashes; // keccak256(pdfCID)

    address public admin;
    string public currentVCSignature;

    modifier onlyAdmin() {
        require(msg.sender == admin, "DegreeSystem: Only admin allowed");
        _;
    }

    event DegreeIssued(string indexed studentDID, string pdfCID);
    event DegreeRejected(string indexed studentDID);
    event VCSignatureUpdated(string vcSignature);

    constructor() {
        admin = msg.sender;
    }

    // Update current VC signature
    function storeVCSignature(string calldata vc) external onlyAdmin {
        currentVCSignature = vc;
        emit VCSignatureUpdated(vc);
    }

    // Issue a new degree and store CID + hash
    function issueDegree(
        string calldata studentDID,
        string calldata pdfCID,
        string calldata date
    ) external onlyAdmin {
        Degree storage degree = issuedDegrees[studentDID];
        require(!degree.issued || degree.rejected, "DegreeSystem: Degree already issued and not rejected");

        issuedDegrees[studentDID] = Degree({
            issued: true,
            pdfHash: pdfCID,
            issuedOn: date,
            vcSignature: currentVCSignature,
            rejected: false
        });

        degreeHashes[studentDID] = keccak256(abi.encodePacked(pdfCID));
        emit DegreeIssued(studentDID, pdfCID);
    }

    // Reject a previously issued degree
    function rejectDegree(string calldata studentDID) external onlyAdmin {
        Degree storage degree = issuedDegrees[studentDID];
        require(degree.issued, "DegreeSystem: Degree not issued yet");

        degree.rejected = true;
        degree.issued = false;
        emit DegreeRejected(studentDID);
    }

    // Return the hash of the CID
    function getDegreeHash(string calldata studentDID) external view returns (bytes32) {
        return degreeHashes[studentDID];
    }

    // Return degree details for frontend
    function getDegreeInfo(string calldata studentDID) external view returns (
        Degree memory degree,
        bytes32 degreeHash
    ) {
        degree = issuedDegrees[studentDID];
        degreeHash = degreeHashes[studentDID];
    }
}
