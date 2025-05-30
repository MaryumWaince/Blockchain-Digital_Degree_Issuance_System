// pages/SignaturePage.jsx
import React from 'react';
import SignatureUpload from '../components/SignatureUpload';
import VcSignatureDisplay from '../components/VcSignatureDisplay';

const SignaturePage = () => {
  return (
    <div>
      <SignatureUpload />
      <VcSignatureDisplay />
    </div>
  );
};

export default SignaturePage;
