import React, { useState } from 'react';
import axios from 'axios';

function DegreePDFGenerator({ studentDID, onPDFGenerated }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      setError('');
      setPdfUrl(null);

      const response = await axios.post(
        `http://localhost:5000/api/degrees/generate-pdf/${studentDID}`
      );

      if (response.data && response.data.pdfPath) {
        const fileUrl = `http://localhost:5000/${response.data.pdfPath}`;
        setPdfUrl(fileUrl);

        // Notify parent to refresh degree status
        if (onPDFGenerated) {
          onPDFGenerated();
        }
      } else {
        setError('PDF generation succeeded, but no file path returned.');
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('PDF generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Generate Degree PDF</h3>
      <button
        onClick={handleGeneratePDF}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Generating...' : 'Generate & Upload PDF'}
      </button>

      {pdfUrl && (
        <div className="mt-3 text-green-700">
          ✅ PDF Uploaded:{" "}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
            View PDF
          </a>
        </div>
      )}

      {error && <p className="text-red-600 mt-2">❌ {error}</p>}
    </div>
  );
}

export default DegreePDFGenerator;
