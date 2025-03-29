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
  generateUserWallet
} from './lib/logic';
import './styles/App.css';

// Configuration
const XION_CONFIG = {
  rpcEndpoint: import.meta.env.VITE_XION_RPC,
  chainId: import.meta.env.VITE_XION_CHAIN_ID,
  denom: import.meta.env.VITE_XION_DENOM,
  gasPrice: GasPrice.fromString(import.meta.env.VITE_XION_GAS_PRICE),
  treasuryAddress: import.meta.env.VITE_TREASURY_ADDRESS
};

async function initXionClient() {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      import.meta.env.VITE_TREASURY_MNEMONIC,
      { prefix: "xion" }
    );
    
    const client = await SigningStargateClient.connectWithSigner(
      XION_CONFIG.rpcEndpoint,
      wallet,
      {
        gasPrice: XION_CONFIG.gasPrice,
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

  useEffect(() => {
    initXionClient().then(({ client, isMock }) => {
      setXionClient(client);
      setIsMock(isMock);
      setStatus(isMock ? 'Ready (mock mode)' : 'Connected to Xion Testnet!');
    });
  }, []);

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
            setStatus('Ready');
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
  }, []);

  const handleCloseMnemonic = () => {
    setShowMnemonic(false);
    setTempMnemonic('');
  };

  if (status.startsWith('Connecting')) {
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

      {status && !status.startsWith('Connecting') && (
        <div className={`status-message ${status.startsWith('Error') ? 'error' : 'info'}`}>
          {status}
        </div>
      )}

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
            XION_CONFIG, 
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