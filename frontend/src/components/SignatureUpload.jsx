// ViceChancellorSignatureUpload.jsx
import React, { useState } from 'react';
import axios from 'axios';

const SignatureUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('signature', file);

    try {
      await axios.post(`${backendUrl}/api/signature/vc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('✅ Signature uploaded successfully');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to upload signature');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Upload VC Signature</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Upload
        </button>
      </form>
      {message && <p className="mt-4 text-center font-medium">{message}</p>}
    </div>
  );
};

export default SignatureUpload;
