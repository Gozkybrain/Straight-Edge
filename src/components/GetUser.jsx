import React, { useState, useEffect } from 'react';
import '../styles/GetUser.css';


const GetUser = ({
  user,
  points,
  txHash,
  isMock,
  status,
  handleLogout,
  handleTap,
  handleClaim,
  checkBalance
}) => {
  const [flyouts, setFlyouts] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showTxSuccess, setShowTxSuccess] = useState(false);

  // Effect to show transaction success for 5 seconds
  useEffect(() => {
    if (txHash) {
      setShowTxSuccess(true);
      const timer = setTimeout(() => {
        setShowTxSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [txHash]);


  // Effect to handle tap cooldown logic
  useEffect(() => {
    if (tapCount >= 20) {
      setCooldown(true);
      setSecondsLeft(60);

      // Start countdown timer
      const timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCooldown(false);
            setTapCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [tapCount]);


  // Handles tap animation and triggers the actual tap action
  const handleTapWithAnimation = () => {
    if (cooldown) return;

    handleTap();
    setTapCount(prev => prev + 1);

    // Create flying +1.00 animation
    const newFlyout = {
      id: Date.now() + Math.random(),
      x: 50 + (Math.random() * 20 - 10)
    };
    setFlyouts([...flyouts, newFlyout]);

    // Remove animation after 1 second
    setTimeout(() => {
      setFlyouts(flyouts.filter(f => f.id !== newFlyout.id));
    }, 1000);
  };


  // Handles claim action with loading state
  const handleClaimWithModal = async () => {
    setIsClaiming(true);
    try {
      await handleClaim();
    } catch (error) {
      console.error("Claim error:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="user-container">
      <div className="user-header">
        <h2 className="user-email">Welcome, {user.email}</h2>
        <div>
          <button
            onClick={checkBalance}
            className="tap-button"
            style={{ marginRight: '10px' }}
          >
            Check Balance
          </button>

          <button
            onClick={handleLogout}
            className="tap-button"
            style={{ background: 'linear-gradient(145deg, #f44336, #d32f2f)' }}
          >
            Logout
          </button>
        </div>
      </div>

      <p className="xion-address">Xion Address: {user.xionAddress}</p>

      {/* Status Indicator - Shows success for 5 sec then returns to normal */}
      {showTxSuccess ? (
        <p className="status-indicator status-success">
          🚀 Transaction Confirmed! Returning to normal...
        </p>
      ) : isMock ? (
        <p className="status-indicator status-mock">⚠️ Using mock mode</p>
      ) : (
        <p className="status-indicator status-connected">🚀 Connected to Xion Testnet</p>
      )}

      {/* Cooldown Indicator */}
      {cooldown && (
        <div className="cooldown-container">
          <p className="status-indicator status-cooldown">
            ⏳ Tap cooldown: {secondsLeft}s remaining
          </p>
          <div className="cooldown-progress">
            <div
              className="cooldown-progress-bar"
              style={{ width: `${(secondsLeft / 60) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="tap-section">
        <div className="balance-display">
          {!cooldown && (
            <p className="taps-display">Taps remaining: {20 - tapCount}/20</p>
          )}
          <p className="points-display">Pending: {points.toFixed(2)}</p>
          {flyouts.map(flyout => (
            <div
              key={flyout.id}
              className="flyout"
              style={{ left: `${flyout.x}%` }}
            >
              +1.00
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <div className="tap-container">
            <button
              onClick={handleTapWithAnimation}
              className="tap-button"
              disabled={cooldown}
            >
              <span className="sparkle"></span>
              {cooldown ? 'Tap Cooldown' : 'Play to Earn (+1.00)'}
            </button>
          </div>

          <div className="claim-container">
            <button
              onClick={handleClaimWithModal}
              disabled={points === 0 || isMock || isClaiming}
              className={`claim-button ${points === 0 ? '' :
                isMock ? 'claim-button-mock' :
                  isClaiming ? 'claim-button-processing' :
                    'claim-button-active'
                }`}
            >
              {isClaiming ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : isMock ? (
                'Enable Real Mode'
              ) : (
                `Claim ${points.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetUser;