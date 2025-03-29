import React from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen = ({ message, subMessage }) => (
  <div className="loading-screen">
    <div className="loading-message">{message}</div>
    {subMessage && <div className="loading-submessage">{subMessage}</div>}
    <div className="loading-spinner"></div>
  </div>
);

export default LoadingScreen;