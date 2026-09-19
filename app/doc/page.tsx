import React from 'react';

const EmbeddedDoc = () => {
  const docUrl = "https://docs.google.com/document/d/1ruxbSwe8Gn5MTcTxFNaYZS6QRofrC8k2awpDd9kgufU/edit?usp=sharing";

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src={docUrl}
        width="100%"
        height="100%"
        title="Google Doc Embed"
        style={{ border: 'none' }}
        allowFullScreen
      />
    </div>
  );
};

export default EmbeddedDoc;
