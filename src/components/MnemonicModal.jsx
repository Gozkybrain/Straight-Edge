// MnemonicModal.jsx
import { useState } from 'react';

const MnemonicModal = ({ mnemonic, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3>Save Your Recovery Phrase</h3>
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          This is the ONLY time you'll see this. Save it securely!
        </p>
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          margin: '15px 0',
          wordBreak: 'break-all'
        }}>
          {mnemonic}
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '8px 15px',
            backgroundColor: copied ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '8px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          I've Saved It
        </button>
      </div>
    </div>
  );
};

export default MnemonicModal;