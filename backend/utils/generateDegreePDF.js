const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const qrcode = require('qrcode');
const fontkit = require('@pdf-lib/fontkit');

const generateDegreePDF = async ({
  studentName,
  studentDID,
  degreeTitle,
  batchNumber,
  resultDate,
  issueDate,
  cgpa,
  semesters,
  overallTotalMarks,
  overallObtainedMarks,
  qrURL,
  vcSignaturePath,
  gcufLogoPath,
  universitySealPath,
  outputPath = 'degree.pdf',
}) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageSize = [595.28, 841.89]; // A4 size
  const inriaBoldItalicBytes = fs.readFileSync('C:/Users/Maryam/Documents/DDIS/backend/fonts/InriaSerif-BoldItalic.ttf');
  const inriaRegularBytes = fs.readFileSync('C:/Users/Maryam/Documents/DDIS/backend/fonts/InriaSerif-Regular.ttf');
  const inriaBoldItalic = await pdfDoc.embedFont(inriaBoldItalicBytes);
  const inriaRegular = await pdfDoc.embedFont(inriaRegularBytes);

  // Load images
  let gcufLogoImage = null, gcufLogoDims = null;
  if (gcufLogoPath) {
    const logoBuffer = fs.readFileSync(gcufLogoPath);
    gcufLogoImage = await pdfDoc.embedPng(logoBuffer);
    gcufLogoDims = gcufLogoImage.scale(0.25);
  }

  let sealImage = null, sealDims = null;
  if (universitySealPath) {
    const sealBuffer = fs.readFileSync(universitySealPath);
    sealImage = await pdfDoc.embedPng(sealBuffer);
    sealDims = sealImage.scale(0.25);
  }

  const drawText = (page, text, x, y, size = 12, font = inriaRegular, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawCenteredText = (page, text, y, size = 12, font = inriaRegular, color = rgb(0, 0, 0)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (page.getWidth() - textWidth) / 2;
    drawText(page, text, x, y, size, font, color);
  };

  const createPage = (isFirstPage = false) => {
    const page = pdfDoc.addPage(pageSize);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
      color: rgb(0.8392, 0.9412, 0.7882),
    });

    if (isFirstPage) {
      if (gcufLogoImage) {
        page.drawImage(gcufLogoImage, {
          x: page.getWidth() - gcufLogoDims.width - 30,
          y: page.getHeight() - gcufLogoDims.height - 30,
          width: gcufLogoDims.width,
          height: gcufLogoDims.height,
        });
      }
      if (sealImage) {
        page.drawImage(sealImage, {
          x: 30,
          y: page.getHeight() - sealDims.height - 30,
          width: sealDims.width,
          height: sealDims.height,
        });
      }
    }

    return page;
  };

  let page = createPage(true);
  let y = page.getHeight() - 60;

  drawCenteredText(page, 'Government College University Faisalabad', y, 20, inriaBoldItalic, rgb(0.278, 0.133, 0.133));
  y -= 25;
  drawCenteredText(page, 'Official Degree Certificate', y, 14, inriaBoldItalic);
  y -= 40;

  const info = [
    `Student Name: ${studentName}`,
    `DID: ${studentDID}`,
    `Degree: ${degreeTitle}`,
    `Batch No: ${batchNumber}`,
    `Result Declaration Date: ${resultDate}`,
    `Issue Date: ${issueDate}`,
    `Final CGPA: ${cgpa}`,
  ];
  info.forEach(line => {
    drawText(page, line, 60, y, 12, inriaRegular);
    y -= 25;
  });

  const cellHeight = 20;
  const cellPadding = 5;
  const startX = 60;
  const bottomMargin = 100;

  const drawSemesterTable = (page, semesterNum, courses, gpa, yStart, semTotalMarks, semObtainedMarks) => {
    const columns = [
      { header: 'Course Name', width: 145 },
      { header: 'Credit Hours', width: 70 },
      { header: 'Total Marks', width: 70 },
      { header: 'Obtained Marks', width: 80 },
      { header: 'QP', width: 70 },
      { header: 'Grade', width: 60 },
    ];

    let y = yStart;
    drawCenteredText(page, `Semester ${semesterNum}`, y, 14, inriaBoldItalic);
    y -= 25;

    let x = startX;
    columns.forEach(col => {
      page.drawRectangle({ x, y, width: col.width, height: cellHeight, borderColor: rgb(0, 0, 0),
  borderWidth: 1});
      drawText(page, col.header, x + cellPadding, y + 5, 10, inriaRegular);
      x += col.width;
    });
    y -= cellHeight;

    for (const course of courses) {
      if (y < bottomMargin) {
        page = createPage();
        y = page.getHeight() - 60;
        drawCenteredText(page, `Semester ${semesterNum} (cont.)`, y, 14, inriaBoldItalic);
        y -= 25;
        x = startX;
        columns.forEach(col => {
          page.drawRectangle({ x, y, width: col.width, height: cellHeight, borderColor: rgb(0, 0, 0),
  borderWidth: 1 });
          drawText(page, col.header, x + cellPadding, y + 5, 10, inriaRegular);
          x += col.width;
        });
        y -= cellHeight;
      }

      x = startX;
      const row = [
        course.courseName,
        course.creditHours.toString(),
        course.totalMarks.toString(),
        course.obtainedMarks.toString(),
        course.qualityPoints.toString(),
        course.grade,
      ];
      row.forEach((cell, i) => {
        page.drawRectangle({ x, y, width: columns[i].width, height: cellHeight, borderColor: rgb(0, 0, 0),
  borderWidth: 1 });
        drawText(page, cell, x + cellPadding, y + 5, 10, inriaRegular);
        x += columns[i].width;
      });
      y -= cellHeight;
    }

    // Final row for Semester Total
    x = startX;
    const totalRow = ['Semester Total', '', semTotalMarks.toString(), semObtainedMarks.toString(), '', ''];
    totalRow.forEach((cell, i) => {
      page.drawRectangle({ x, y, width: columns[i].width, height: cellHeight, borderColor: rgb(0, 0, 0),
  borderWidth: 1 });
      drawText(page, cell, x + cellPadding, y + 5, 10, inriaBoldItalic);
      x += columns[i].width;
    });
    y -= cellHeight;

    drawText(page, `GPA: ${gpa}`, startX, y - 5, 12, inriaBoldItalic);

    return { page, y: y - 30 };
  };

  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i];
    const result = drawSemesterTable(
      page,
      sem.semester,
      sem.courses,
      sem.gpa,
      y,
      sem.totalMarks || 0,
      sem.obtainedMarks || 0
    );
    page = result.page;
    y = result.y;
  }

  if (y < 150) {
    page = createPage();
    y = page.getHeight() - 60;
  }

  // Final summary row: Overall Total, Obtained, CGPA
  const summaryCols = [
    { label: `Total Marks: ${overallTotalMarks}`, width: 180 },
    { label: `Obtained Marks: ${overallObtainedMarks}`, width: 180 },
    { label: `Final CGPA: ${cgpa}`, width: 180 },
  ];
  let x = startX;
  summaryCols.forEach(col => {
    page.drawRectangle({ x, y, width: col.width, height: cellHeight, borderColor: rgb(0, 0, 0),
  borderWidth: 1 });
    drawText(page, col.label, x + cellPadding, y + 5, 11, inriaBoldItalic);
    x += col.width;
  });
  y -= cellHeight + 20;

  // Add QR code
  const qrData = await qrcode.toBuffer(qrURL, { type: 'png' });
  const qrImage = await pdfDoc.embedPng(qrData);
  const qrDims = qrImage.scale(0.5);
  page.drawImage(qrImage, {
    x: page.getWidth() - qrDims.width - 60,
    y: 60,
    width: qrDims.width,
    height: qrDims.height,
  });

  // Vice Chancellor Signature
  const vcImageBuffer = fs.readFileSync(vcSignaturePath);
  const vcImage = await pdfDoc.embedPng(vcImageBuffer);
  const vcDims = vcImage.scale(0.5);
  page.drawImage(vcImage, {
    x: 60,
    y: 60,
    width: vcDims.width,
    height: vcDims.height,
  });
  drawText(page, 'Vice Chancellor', 60, 50, 10, inriaRegular);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`📄 Degree PDF saved to: ${outputPath}`);
};

module.exports = generateDegreePDF;


/*
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const qrcode = require('qrcode');
const fontkit = require('@pdf-lib/fontkit');

const generateDegreePDF = async ({
  studentName,
  studentDID,
  degreeTitle,
  batchNumber,
  resultDate,
  issueDate,
  cgpa,
  semesters,
  overallTotalMarks,
  overallObtainedMarks,
  qrURL,
  vcSignaturePath,
  gcufLogoPath,
  universitySealPath,
  outputPath = 'degree.pdf',
}) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageSize = [595.28, 841.89]; // A4 size
  const inriaBoldItalicBytes = fs.readFileSync('C:/Users/Maryam/Documents/DDIS/backend/fonts/InriaSerif-BoldItalic.ttf');
  const inriaRegularBytes = fs.readFileSync('C:/Users/Maryam/Documents/DDIS/backend/fonts/InriaSerif-Regular.ttf');
  const inriaBoldItalic = await pdfDoc.embedFont(inriaBoldItalicBytes);
  const inriaRegular = await pdfDoc.embedFont(inriaRegularBytes);

  // Load images
  let gcufLogoImage = null, gcufLogoDims = null;
  if (gcufLogoPath) {
    const logoBuffer = fs.readFileSync(gcufLogoPath);
    gcufLogoImage = await pdfDoc.embedPng(logoBuffer);
    gcufLogoDims = gcufLogoImage.scale(0.25);
  }

  let sealImage = null, sealDims = null;
  if (universitySealPath) {
    const sealBuffer = fs.readFileSync(universitySealPath);
    sealImage = await pdfDoc.embedPng(sealBuffer);
    sealDims = sealImage.scale(0.25);
  }

  const drawText = (page, text, x, y, size = 12, font = inriaRegular, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawCenteredText = (page, text, y, size = 12, font = inriaRegular, color = rgb(0, 0, 0)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (page.getWidth() - textWidth) / 2;
    drawText(page, text, x, y, size, font, color);
  };

  const createPage = (isFirstPage = false) => {
    const page = pdfDoc.addPage(pageSize);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
      color: rgb(0.8392, 0.9412, 0.7882),
    });

    if (isFirstPage) {
      if (gcufLogoImage) {
        page.drawImage(gcufLogoImage, {
          x: page.getWidth() - gcufLogoDims.width - 30,
          y: page.getHeight() - gcufLogoDims.height - 30,
          width: gcufLogoDims.width,
          height: gcufLogoDims.height,
        });
      }
      if (sealImage) {
        page.drawImage(sealImage, {
          x: 30,
          y: page.getHeight() - sealDims.height - 30,
          width: sealDims.width,
          height: sealDims.height,
        });
      }
    }

    return page;
  };

  let page = createPage(true);
  let y = page.getHeight() - 60;

  drawCenteredText(page, 'Government College University Faisalabad', y, 20, inriaBoldItalic, rgb(0.278, 0.133, 0.133));
  y -= 25;
  drawCenteredText(page, 'Official Degree Certificate', y, 14, inriaBoldItalic);
  y -= 40;

  const info = [
    `Student Name: ${studentName}`,
    `DID: ${studentDID}`,
    `Degree: ${degreeTitle}`,
    `Batch No: ${batchNumber}`,
    `Result Declaration Date: ${resultDate}`,
    `Issue Date: ${issueDate}`,
    `Final CGPA: ${cgpa}`,
  ];
  info.forEach(line => {
    drawText(page, line, 60, y, 12, inriaRegular);
    y -= 25;
  });

  const cellHeight = 20;
  const cellPadding = 5;
  const startX = 60;
  const bottomMargin = 100;

  const drawSemesterTable = (page, semesterNum, courses, gpa, yStart, semTotalMarks, semObtainedMarks) => {
    const columns = [
      { header: 'Course Name', width: 145 },
      { header: 'Credit Hours', width: 70 },
      { header: 'Total Marks', width: 70 },
      { header: 'Obtained Marks', width: 80 },
      { header: 'QP', width: 70 },
      { header: 'Grade', width: 60 },
    ];

    let y = yStart;
    drawCenteredText(page, `Semester ${semesterNum}`, y, 14, inriaBoldItalic);
    y -= 25;

    let x = startX;
    columns.forEach(col => {
      page.drawRectangle({ x, y, width: col.width, height: cellHeight, borderColor: rgb(0, 0, 0), borderWidth: 1 });
      drawText(page, col.header, x + cellPadding, y + 5, 10, inriaRegular);
      x += col.width;
    });
    y -= cellHeight;

    for (const course of courses) {
      if (y < bottomMargin) {
        page = createPage();
        y = page.getHeight() - 60;
        drawCenteredText(page, `Semester ${semesterNum} (cont.)`, y, 14, inriaBoldItalic);
        y -= 25;
        x = startX;
        columns.forEach(col => {
          page.drawRectangle({ x, y, width: col.width, height: cellHeight, borderColor: rgb(0, 0, 0), borderWidth: 1 });
          drawText(page, col.header, x + cellPadding, y + 5, 10, inriaRegular);
          x += col.width;
        });
        y -= cellHeight;
      }

      x = startX;
      const row = [
        course.courseName,
        course.creditHours.toString(),
        course.totalMarks.toString(),
        course.obtainedMarks.toString(),
        course.qualityPoints.toString(),
        course.grade,
      ];
      row.forEach((cell, i) => {
        page.drawRectangle({ x, y, width: columns[i].width, height: cellHeight, borderColor: rgb(0, 0, 0), borderWidth: 1 });
        drawText(page, cell, x + cellPadding, y + 5, 10, inriaRegular);
        x += columns[i].width;
      });
      y -= cellHeight;
    }

    if (y < bottomMargin) {
      page = createPage();
      y = page.getHeight() - 60;
    }

    drawText(page, `Semester Total Marks: ${semTotalMarks}`, startX, y - 10, 11, inriaRegular);
    drawText(page, `Semester Obtained Marks: ${semObtainedMarks}`, startX + 250, y - 10, 11, inriaRegular);
    drawText(page, `GPA: ${gpa}`, startX, y - 30, 12, inriaBoldItalic);

    return { page, y: y - 50 };
  };

  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i];
    const result = drawSemesterTable(
      page,
      sem.semester,
      sem.courses,
      sem.gpa,
      y,
      sem.totalMarks || 0,
      sem.obtainedMarks || 0
    );
    page = result.page;
    y = result.y;
  }

  if (y < 150) {
    page = createPage();
    y = page.getHeight() - 60;
  }

  drawText(page, `Overall Total Marks: ${overallTotalMarks}`, startX, y, 12, inriaBoldItalic);
  y -= 20;
  drawText(page, `Overall Obtained Marks: ${overallObtainedMarks}`, startX, y, 12, inriaBoldItalic);

  // Add QR code
  const qrData = await qrcode.toBuffer(qrURL, { type: 'png' });
  const qrImage = await pdfDoc.embedPng(qrData);
  const qrDims = qrImage.scale(0.5);
  page.drawImage(qrImage, {
    x: page.getWidth() - qrDims.width - 60,
    y: 60,
    width: qrDims.width,
    height: qrDims.height,
  });

  // Vice Chancellor Signature
  const vcImageBuffer = fs.readFileSync(vcSignaturePath);
  const vcImage = await pdfDoc.embedPng(vcImageBuffer);
  const vcDims = vcImage.scale(0.5);
  page.drawImage(vcImage, {
    x: 60,
    y: 60,
    width: vcDims.width,
    height: vcDims.height,
  });
  drawText(page, 'Vice Chancellor', 60, 50, 10, inriaRegular);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`📄 Degree PDF saved to: ${outputPath}`);
};

module.exports = generateDegreePDF;
*/