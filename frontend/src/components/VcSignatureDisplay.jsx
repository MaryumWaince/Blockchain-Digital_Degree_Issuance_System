// components/VcSignatureDisplay.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VcSignatureDisplay = () => {
  const [signatureUrl, setSignatureUrl] = useState('');
  const [error, setError] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/signature/vc`);
        setSignatureUrl(res.data.imageUrl);
      } catch (err) {
        console.error(err);
        setError('❌ Could not load VC signature.');
      }
    };

    fetchSignature();
  }, [backendUrl]);

  return (
    <div className="max-w-xl mx-auto mt-6 p-6 bg-gray-100 rounded-lg shadow-sm text-center">
      <h2 className="text-xl font-semibold mb-4">Vice Chancellor's Signature</h2>
      {signatureUrl ? (
        <img
          src={signatureUrl}
          alt="VC Signature"
          className="mx-auto w-48 h-auto border rounded-md shadow"
        />
      ) : (
        <p>{error || 'Loading signature...'}</p>
      )}
    </div>
  );
};

export default VcSignatureDisplay;
