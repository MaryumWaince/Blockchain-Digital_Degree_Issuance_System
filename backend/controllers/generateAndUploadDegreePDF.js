const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { NFTStorage, File } = require('nft.storage');
const Degree = require('../models/Degree');

const client = new NFTStorage({ token: process.env.NFT_STORAGE_TOKEN });

async function generateAndUploadDegreePDF(req, res) {
  try {
    const { studentDID } = req.params;

    const degree = await Degree.findOne({ studentDID });
    if (!degree || degree.status.toLowerCase() !== 'approved') {
      return res.status(404).json({ error: 'Degree not approved or not found.' });
    }

    const fileName = `${studentDID}_degree.pdf`;
    const pdfsDir = path.join(__dirname, '../blockchain/pdfs');
    const filePath = path.join(pdfsDir, fileName);

    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(24).text('University Degree Certificate', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14)
      .text(`Student Name: ${degree.studentName || 'N/A'}`)
      .text(`Student Email: ${degree.studentEmail || 'N/A'}`)
      .text(`DID: ${degree.studentDID}`)
      .text(`Degree: ${degree.degreeName || 'N/A'}`)
      .text(`CGPA: ${degree.cgpa || 'N/A'}`)
      .text(`Issued On: ${degree.issuedOn ? new Date(degree.issuedOn).toDateString() : 'N/A'}`)
      .text(`Result Declaration Date: ${degree.resultDeclarationDate ? new Date(degree.resultDeclarationDate).toDateString() : 'N/A'}`)
      .text(`Blockchain Hash: ${degree.blockchainHash || 'Not Available'}`)
      .text(`Status: ${degree.status}`);

    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));

    const buffer = fs.readFileSync(filePath);

    let metadata;
    try {
      metadata = await client.store({
        name: 'Degree Certificate',
        description: `Degree certificate for student DID ${studentDID}`,
        image: new File([buffer], fileName, { type: 'application/pdf' }),
        properties: {
          studentDID: degree.studentDID,
          studentName: degree.studentName,
          degree: degree.degreeName,
          cgpa: degree.cgpa,
        },
      });
    } catch (err) {
      console.error('NFT.storage upload failed:', err.message);
      return res.status(500).json({ error: 'Failed to upload PDF to IPFS.' });
    }

    const ipfsUrl = metadata.url;
    console.log(`PDF uploaded to IPFS: ${ipfsUrl}`);

    degree.pdfPath = ipfsUrl;
    degree.status = 'Issued';
    await degree.save();

    fs.unlinkSync(filePath);

    res.json({
      message: 'PDF generated and uploaded successfully.',
      ipfsUrl,
      status: degree.status,
    });

  } catch (error) {
    console.error('Error in PDF generation/upload:', error);
    res.status(500).json({ error: 'Failed to generate and upload degree PDF.' });
  }
}

module.exports = generateAndUploadDegreePDF;
