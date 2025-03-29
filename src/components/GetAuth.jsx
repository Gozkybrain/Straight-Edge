import React, { useState, useEffect } from 'react';
import '../styles/GetAuth.css';

const GetAuth = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  isRegistering, 
  setIsRegistering, 
  handleRegister, 
  handleLogin, 
  status 
}) => {
  const [text, setText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  const displayDuration = 5000;
  const texts = [
    "Hello Sarcastic Geek Trybe,",
    "Ready to Tap Tap?",
    "Tap Tap to win!"
  ];

  useEffect(() => {
    setText(texts[currentTextIndex]);
    
    if (currentTextIndex === texts.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentTextIndex((prevIndex) => prevIndex + 1);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [currentTextIndex]);

  return (
    <div className="auth-container">
      <h3 className="tap-tap">Straight Edge</h3>
      <div className="typed-text">{text}</div>
      
      <div className="log">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        
        <input
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        
        <button
          className="auth-button"
          onClick={isRegistering ? handleRegister : handleLogin}
          disabled={status.includes('Loading')}
        >
          {status.includes('Loading') ? 'Please wait...' : isRegistering ? 'Register' : 'Login'}
        </button>
  
        <button
          className="toggle-auth"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
};

export default GetAuth;