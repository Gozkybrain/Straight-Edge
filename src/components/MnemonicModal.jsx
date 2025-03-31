import { useState } from 'react';
import '../styles/MnemonicModal.css';

const AccountConfirmationModal = ({ onClose }) => {
  const [buttonText, setButtonText] = useState('Close');

  const handleClose = () => {
    setButtonText('Closing...');
    setTimeout(() => {
      onClose();
      setButtonText('Close');
    }, 500);
  };

  return (
    <div className="mnemonic-modal-overlay">
      <div className="mnemonic-modal-content">
        <h3 className="mnemonic-modal-title">Account Created Successfully!</h3>
        
        <div className="mnemonic-display">
          <div className="success-message">
            <p>✅ You can always login using your email and password</p>
            <p>🔐 Your account is securely managed by Xion's authentication system</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="mnemonic-button confirm-button"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default AccountConfirmationModal;