// GetUser.jsx
export default function GetUser({ 
  user, 
  points, 
  txHash, 
  isMock, 
  status, 
  handleLogout, 
  handleTap, 
  handleClaim, 
  checkBalance 
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#333' }}>Welcome, {user.email}</h2>
        <button onClick={checkBalance} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Check Balance for wallet
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '5px 10px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <p style={{ wordBreak: 'break-all', fontSize: '0.9em', color: '#555' }}>
        Xion Address: {user.xionAddress}
      </p>
      {isMock ? (
        <p style={{ color: '#ff9800' }}>⚠️ Using mock mode</p>
      ) : (
        <p style={{ color: '#4CAF50' }}>✔️ Connected to Xion Testnet</p>
      )}

      <div style={{ margin: '20px 0', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <p>Pending Points: {points}</p>
        <button
          onClick={handleTap}
          style={{
            width: '100%',
            padding: '10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tap to Earn
        </button>
      </div>

      <div style={{ margin: '20px 0' }}>
        <button
          onClick={handleClaim}
          disabled={points === 0 || isMock}
          style={{
            width: '100%',
            padding: '10px',
            background: points === 0 ? '#cccccc' : isMock ? '#ff9800' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: points === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {isMock ? 'Enable Real Mode to Claim' : `Claim ${points} Points`}
        </button>
      </div>

      {txHash && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Transaction Hash: {txHash}</p>
          {!isMock && (
            <a
              href={`https://explorer.burnt.com/xion-testnet-1/account/${user.xionAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2196F3', textDecoration: 'none' }}
            >
              View on Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}