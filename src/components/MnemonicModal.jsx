import { useState } from 'react';
import '../styles/MnemonicModal.css';

const MnemonicModal = ({ mnemonic, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mnemonic-modal-overlay">
      <div className="mnemonic-modal-content">
        <h3 className="mnemonic-modal-title">Save Your Recovery Phrase</h3>
        <p className="mnemonic-warning">
          This is the ONLY time you'll see this. Save it securely!
        </p>
        <div className="mnemonic-display">
          {mnemonic}
        </div>
        <button
          onClick={handleCopy}
          className={`mnemonic-button copy-button ${copied ? 'copied' : ''}`}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={onClose}
          className="mnemonic-button confirm-button"
        >
          I've Saved It
        </button>
      </div>
    </div>
  );
};

export default MnemonicModal;