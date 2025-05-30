const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Ensure the output folder exists
const outputDir = './degree_pdfs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const doc = new PDFDocument();
const filePath = `${outputDir}/sample.pdf`;

// Register the Noto Sans font (supports many Unicode chars and emojis)
doc.registerFont('NotoSans', path.join(__dirname, 'fonts', 'NotoSans-Regular.ttf'));

doc.pipe(fs.createWriteStream(filePath));

doc.font('NotoSans').fontSize(25).text('🎓 Sample Degree PDF', 100, 100);
doc.moveDown();
doc.font('NotoSans').fontSize(16).text('This is a test PDF file served from the backend.');

doc.end();

console.log(`✅ PDF generated at: ${filePath}`);
