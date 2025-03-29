import React from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen = ({ message, subMessage }) => (
  <div className="loading-screen">
    <div className="loading-grid">
      <div className="loading-box"></div>
      <div className="loading-box"></div>
      <div className="loading-box"></div>
      <div className="loading-box"></div>
    </div>
    <div className="loading-message">{message}</div>
    {subMessage && <div className="loading-submessage">{subMessage}</div>}
  </div>
);

export default LoadingScreen;