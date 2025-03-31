import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import GetAuth from './components/GetAuth';
import GetUser from './components/GetUser';
import MnemonicModal from './components/MnemonicModal';
import LoadingScreen from './components/LoadingScreen';
import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleTap,
  checkBalance,
  handleClaim,
} from './lib/logic';
import './styles/App.css';

// Available RPC endpoints
const RPC_ENDPOINTS = [
  { url: import.meta.env.VITE_XION_RPC, label: "Primary" },
  { url: "https://xion-rpc.zensuite.xyz", label: "Zensuite" },
  { url: "https://xion-rpc.polkachu.com", label: "Polkachu" },
  { url: "https://xion-rpc.lavenderfive.com", label: "Lavender" }
];

// Initialize connection to Xion blockchain
async function initXionClient(rpcUrl) {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      import.meta.env.VITE_TREASURY_MNEMONIC,
      { prefix: "xion" }
    );

    const client = await SigningStargateClient.connectWithSigner(
      rpcUrl,
      wallet,
      {
        gasPrice: GasPrice.fromString(import.meta.env.VITE_XION_GAS_PRICE),
        prefix: "xion"
      }
    );

    await client.getChainId();
    return { client, isMock: false };
  } catch (error) {
    console.error("Connection failed:", error);
    return {
      client: {
        sendTokens: () => Promise.resolve({
          code: 0,
          transactionHash: '0xmock-' + Math.random().toString(16).slice(2)
        }),
        getAllBalances: () => Promise.resolve([])
      },
      isMock: true
    };
  }
}

function App() {
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentRpc, setCurrentRpc] = useState(RPC_ENDPOINTS[0].url);


  const XION_CONFIG = {
    rpcEndpoint: currentRpc,
    chainId: import.meta.env.VITE_XION_CHAIN_ID || 'xion-testnet-1',
    denom: import.meta.env.VITE_XION_DENOM || 'uxion',
    gasPrice: import.meta.env.VITE_XION_GAS_PRICE || '0.025uxion',
    treasuryAddress: import.meta.env.VITE_TREASURY_ADDRESS
  };

  
  // Initialize blockchain connection
  useEffect(() => {
    const connect = async () => {
      const { client, isMock } = await initXionClient(currentRpc);
      setXionClient(client);
      setIsMock(isMock);
      setStatus(isMock
        ? 'Using mock mode (RPC unavailable)'
        : `Connected to ${RPC_ENDPOINTS.find(rpc => rpc.url === currentRpc)?.label || 'Xion Testnet'}`
      );
    };
    connect();
  }, [currentRpc]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setStatus('Loading user data...');
          const userRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            setUser({
              ...docSnap.data(),
              uid: firebaseUser.uid
            });
            setStatus(isMock
              ? 'Ready (mock mode)'
              : `Connected to ${RPC_ENDPOINTS.find(rpc => rpc.url === currentRpc)?.label || 'Xion Testnet'}`
            );
          } else {
            setStatus('User data not found');
            await signOut(auth);
          }
        } catch (error) {
          setStatus(`Error loading user: ${error.message}`);
        }
      }
      setCheckingAuth(false);
    });

    
    return () => unsubscribe();
  }, [currentRpc, isMock]);

  const handleCloseMnemonic = () => {
    setShowMnemonic(false);
    setTempMnemonic('');
  };

  const switchRpc = async (rpcUrl) => {
    setStatus(`Switching to ${RPC_ENDPOINTS.find(rpc => rpc.url === rpcUrl)?.label || 'new RPC'}...`);
    setCurrentRpc(rpcUrl);
  };

  // Loading states
  if (status.startsWith('Connecting') || status.startsWith('Switching')) {
    return <LoadingScreen
      message={status}
      subMessage={isMock ? "Will use mock mode if connection fails" : null}
    />;
  }

  if (checkingAuth) {
    return <LoadingScreen message="Checking authentication... Please wait" />;
  }

  return (
    <div className="app-container">
      {showMnemonic && (
        <MnemonicModal
          mnemonic={tempMnemonic}
          onClose={handleCloseMnemonic}
        />
      )}

      {/* Status and RPC Controls */}
      <div className="connection-status">
        <div className={`status-message ${status.includes('Error') ? 'error' : 'info'}`}>
          {status}
        </div>

        {isMock && (
          <div className="rpc-controls">
            <p className="status-indicator status-mock">⚠️ Could not connect to Primary RPC, Select another</p>
            <div className="rpc-buttons">
              {RPC_ENDPOINTS.map((rpc) => (
                <button
                  key={rpc.url}
                  onClick={() => switchRpc(rpc.url)}
                  className={`claim-button ${currentRpc === rpc.url ? 'active' : ''}`}
                >
                  {rpc.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!user ? (
        <GetAuth
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          handleRegister={() => handleRegister(
            email,
            password,
            setUser,
            setStatus,
            setTempMnemonic,
            setShowMnemonic
          )}
          handleLogin={() => handleLogin(email, password, setStatus)}
          status={status}
        />
      ) : (
        <GetUser
  user={user}
  points={points}
  txHash={txHash}
  isMock={isMock}
  status={status}
  handleLogout={() => handleLogout(setUser, setPoints, setTxHash, setStatus)}
  handleTap={() => handleTap(user, points, setPoints)}
  handleClaim={() => handleClaim(
    user,
    points,
    xionClient,
    XION_CONFIG, // Make sure this is defined in your App.jsx
    setTxHash,
    setPoints,
    setStatus,
    isMock
  )}
  checkBalance={() => checkBalance(user, XION_CONFIG, setStatus)}
/>
      )}
    </div>
  );
}

export default App;