// GetAuth.jsx
export default function GetAuth({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  isRegistering, 
  setIsRegistering, 
  handleRegister, 
  handleLogin, 
  status 
}) {
  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>
        {isRegistering ? 'Register' : 'Login'}
      </h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{
          width: '100%',
          padding: '10px',
          margin: '10px 0',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{
          width: '100%',
          padding: '10px',
          margin: '10px 0',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
      <button
        onClick={isRegistering ? handleRegister : handleLogin}
        style={{
          width: '100%',
          padding: '10px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        disabled={status.includes('Loading')}
      >
        {status.includes('Loading') ? 'Please wait...' : isRegistering ? 'Register' : 'Login'}
      </button>

      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            cursor: 'pointer'
          }}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}