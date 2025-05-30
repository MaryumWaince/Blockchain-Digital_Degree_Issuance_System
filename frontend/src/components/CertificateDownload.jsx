import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import DegreeCertificate from './DegreeCertificate';

const CertificateDownload = ({ degreeData }) => {
  const componentRef = useRef();

  return (
    <div>
      {degreeData?.status === 'Issued' ? (
        <>
          <ReactToPrint
            trigger={() => <button className="btn btn-primary">Download Degree PDF</button>}
            content={() => componentRef.current}
            pageStyle="@page { size: A4; margin: 20mm }"
          />

          <div style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden' }}>
            <div ref={componentRef}>
              <DegreeCertificate data={degreeData} />
            </div>
          </div>
        </>
      ) : (
        <p>Degree not yet issued.</p>
      )}
    </div>
  );
};

export default CertificateDownload;
