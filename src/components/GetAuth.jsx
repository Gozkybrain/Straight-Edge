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
    "Sarcastic Geek Trybe,",
    "Ready to Play Edge?",
    "100% Secure, LFG! 🚀"
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
      
      <div className='auth-form-cover'>
     <div>
          <div className='log'>Email:</div>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="johndoe@xion.com"
          />
          
          <div className='log'>Password:</div>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
     </div>
        
        <button
          className="auth-button"
          onClick={isRegistering ? handleRegister : handleLogin}
          disabled={status.includes('Loading')}
        >
          {status.includes('Loading') ? 'Please wait...' : isRegistering ? 'Register Account' : 'Login Account'}
        </button>
  
        <button
          className="toggle-auth"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
};

export default GetAuth;