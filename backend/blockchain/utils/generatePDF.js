const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = async (studentData, filename) => {
  const doc = new PDFDocument();
  const pdfPath = path.join(__dirname, '..', 'temp', filename);
  doc.pipe(fs.createWriteStream(pdfPath));

  doc.fontSize(18).text('Degree Certificate', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Student Name: ${studentData.name}`);
  doc.text(`Student DID: ${studentData.did}`);
  doc.text(`Degree: ${studentData.degree}`);
  doc.text(`Issue Date: ${studentData.issueDate}`);

  doc.end();

  return pdfPath;
};

module.exports = generatePDF;
