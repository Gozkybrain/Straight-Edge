// App.jsx
import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';

// Configuration
const XION_CONFIG = {
  rpcEndpoint: "https://xion-rpc.polkachu.com",
  chainId: "xion-testnet-2",
  denom: "uxion",
  gasPrice: GasPrice.fromString("0.025uxion"),
  treasuryAddress: "xion1ck6xmvxpfqldnczcpkky9xzt6txfc0jxufnxws" // Your treasury address
};

// Initialize Xion Client
const initXionClient = async () => {
  try {
    const client = await SigningStargateClient.connectWithSigner(
      XION_CONFIG.rpcEndpoint,
      null, // No signer needed for read-only
      {
        gasPrice: XION_CONFIG.gasPrice,
        prefix: "xion"
      }
    );
    return {
      client,
      isMock: false
    };
  } catch (error) {
    console.error("Xion Connection Error:", error);
    return {
      client: {
        sendTokens: () => Promise.resolve({
          code: 0,
          transactionHash: '0xmock-' + Math.random().toString(16).slice(2)
        })
      },
      isMock: true
    };
  }
};

// Generate new wallet for user
const generateUserWallet = async () => {
  const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: "xion" });
  const [account] = await wallet.getAccounts();
  return {
    address: account.address,
    mnemonic: wallet.mnemonic
  };
};

// MnemonicModal component
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

export default function TapGame() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState('Connecting to Xion Testnet...');
  const [isMock, setIsMock] = useState(true);
  const [xionClient, setXionClient] = useState(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [tempMnemonic, setTempMnemonic] = useState('');

  // Initialize Xion connection
  useEffect(() => {
    initXionClient().then(({ client, isMock }) => {
      setXionClient(client);
      setIsMock(isMock);
      setStatus(isMock ? 'Ready (mock mode)' : 'Connected to Xion Testnet!');
    });
  }, []);

  const handleRegister = async () => {
    try {
      setStatus('Creating account...');

      // 1. Generate Xion wallet
      const { address, mnemonic } = await generateUserWallet();

      // 2. Create Firebase user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // 3. Save user data in users/xion/{uid} (without mnemonic)
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        email: firebaseUser.email,
        xionAddress: address,
        balance: 0,
        pendingPoints: 0,
        createdAt: new Date().toISOString()
      });

      setUser({
        email: firebaseUser.email,
        xionAddress: address,
        uid: firebaseUser.uid
      });

      setStatus('Account created!');
      // Show mnemonic in modal
      setTempMnemonic(mnemonic);
      setShowMnemonic(true);

    } catch (error) {
      setStatus(`Registration Error: ${error.message}`);
    }
  };

  const handleCloseMnemonic = () => {
    setShowMnemonic(false);
    setTempMnemonic(''); // Clear from memory
  };

  const handleLogin = async () => {
    try {
      setStatus('Logging in...');
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);

      // Get user data from users/xion/{uid}
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        throw new Error("No account found. Please register.");
      }

      setUser({
        ...docSnap.data(),
        uid: firebaseUser.uid
      });
      setStatus('Ready');
    } catch (error) {
      setStatus(`Login Error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPoints(0);
    setTxHash('');
  };

  const handleTap = async () => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pendingPoints: increment(1)
    });
    setPoints(p => p + 1);
  };

  const checkBalance = async () => {
    try {
      if (!user?.xionAddress) {
        setStatus("No Xion address found");
        return;
      }

      setStatus("Fetching balance...");

      // Connect to the Xion Testnet
      const client = await SigningStargateClient.connect(XION_CONFIG.rpcEndpoint);

      // Fetch balance for the user's address
      const balances = await client.getAllBalances(user.xionAddress);

      // Find UXION balance
      const uxionBalance = balances.find(balance => balance.denom === XION_CONFIG.denom);

      if (uxionBalance) {
        setStatus(`Balance: ${uxionBalance.amount} ${XION_CONFIG.denom}`);
      } else {
        setStatus("No UXION balance found.");
      }
    } catch (error) {
      setStatus(`Balance Check Error: ${error.message}`);
    }
  };



  const handleClaim = async () => {
    try {
      if (!user?.xionAddress) {
        throw new Error("No Xion address found");
      }

      setStatus(isMock ? 'Simulating...' : 'Processing...');

      // Send from treasury to user
      const result = await xionClient.sendTokens(
        XION_CONFIG.treasuryAddress,
        user.xionAddress,
        [{ denom: XION_CONFIG.denom, amount: (points * 1000000).toString() }],
        {
          amount: [{ denom: XION_CONFIG.denom, amount: "1000" }], // Small fee
          gas: "200000"
        }
      );

      // Update balances
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(points),
        pendingPoints: increment(-points)
      });

      setTxHash(result.transactionHash);
      setPoints(0);
      setStatus('Transaction confirmed!');
    } catch (error) {
      setStatus(`Transaction Error: ${error.message}`);
    }
  };

  if (status.startsWith('Connecting')) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>{status}</div>
        {isMock && <div style={{ marginTop: '10px', color: '#666' }}>Will use mock mode if connection fails</div>}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {showMnemonic && (
        <MnemonicModal
          mnemonic={tempMnemonic}
          onClose={handleCloseMnemonic}
        />
      )}

      {status !== 'Ready' && !status.startsWith('Connecting') && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: status.startsWith('Error') ? '#ffebee' : '#e3f2fd',
          color: status.startsWith('Error') ? '#d32f2f' : '#1565c0',
          borderRadius: '4px'
        }}>
          {status}
        </div>
      )}

      {!user ? (
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
            disabled={status.includes('Connecting')}
          >
            {status.includes('Connecting') ? 'Loading...' : isRegistering ? 'Register' : 'Login'}
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
      ) : (
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
                  href={`https://explorer.xion-testnet.burnt.com/tx/${txHash}`}
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
      )}
    </div>
  );
}