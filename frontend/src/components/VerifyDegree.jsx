import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import '../styles/VerifyDegree.css';

const VerifyDegree = () => {
  const [input, setInput] = useState('');
  const [degree, setDegree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setDegree(null);

    try {
      const res = await axios.get(`/api/degree/verify?input=${input.trim()}`);
      setDegree(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const ipfsUrl = degree?.ipfsHash
    ? `https://ipfs.io/ipfs/${degree.ipfsHash}`
    : null;

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2 className="verify-title">🎓 Degree Verification</h2>

        <p className="verify-description">
          Enter your <strong>DID</strong> or <strong>Blockchain Hash</strong> below to verify your degree.
        </p>

        <div className="verify-input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. did:example:123456789abcdef or 0xABC123..."
            className="verify-input"
            autoFocus
          />
          <button
            onClick={handleVerify}
            disabled={loading}
            className={`verify-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {error && <div className="verify-error">{error}</div>}

        {degree && (
          <div className="verify-result">
            <h3 className="verify-success">✅ Degree Verified</h3>

            <div className="verify-details">
              <p><span className="label">Name:</span> {degree.name}</p>
              <p><span className="label">Student DID:</span> {degree.studentDID}</p>
              <p><span className="label">Degree:</span> {degree.degree}</p>
              <p><span className="label">CGPA:</span> {degree.cgpa}</p>
              <p><span className="label">Batch:</span> {degree.batch}</p>
              <p><span className="label">Result Date:</span> {degree.resultDate}</p>
              <p><span className="label">Issued On:</span> {new Date(degree.issueDate).toLocaleDateString()}</p>
            </div>

            {ipfsUrl && (
              <div className="verify-ipfs-section">
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="verify-ipfs-link"
                >
                  🔗 View Degree PDF on IPFS
                </a>

                <div className="verify-qr">
                  <p className="qr-label">🔍 Scan to Verify</p>
                  <QRCode value={ipfsUrl} size={160} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyDegree;
