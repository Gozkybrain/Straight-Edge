import { auth, db } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import {
    signOut,
    signInWithEmailAndPassword,  // Add this import
    createUserWithEmailAndPassword  // Also add this if not already present
} from 'firebase/auth'; // Add this import


export const generateUserWallet = async () => {
  const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: "xion" });
  const [account] = await wallet.getAccounts();
  return {
    address: account.address,
    mnemonic: wallet.mnemonic
  };
};

export const handleRegister = async (email, password, setUser, setStatus, setTempMnemonic, setShowMnemonic) => {
  try {
    setStatus('Creating account...');
    const { address, mnemonic } = await generateUserWallet();
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

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
    setTempMnemonic(mnemonic);
    setShowMnemonic(true);
  } catch (error) {
    setStatus(`Registration Error: ${error.message}`);
  }
};

export const handleLogin = async (email, password, setStatus) => {
  try {
    setStatus('Logging in...');
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    setStatus(`Login Error: ${error.message}`);
  }
};

export const handleLogout = async (setUser, setPoints, setTxHash, setStatus) => {
  await signOut(auth);
  setUser(null);
  setPoints(0);
  setTxHash('');
  setStatus('Ready');
};

export const handleTap = async (user, points, setPoints) => {
  if (!user) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pendingPoints: increment(1)
    });
    setPoints(p => p + 1);
  } catch (error) {
    console.error("Error updating points:", error);
  }
};

export const checkBalance = async (user, XION_CONFIG, setStatus) => {
  if (!user?.xionAddress) {
    setStatus("No Xion address found");
    return;
  }

  try {
    setStatus("Fetching balance...");
    const client = await SigningStargateClient.connect(XION_CONFIG.rpcEndpoint);
    const balances = await client.getAllBalances(user.xionAddress);
    
    const balance = balances.find(b => 
      b.denom === XION_CONFIG.denom || 
      b.denom === "uxion" || 
      b.denom === "stake"
    );

    if (balance) {
      setStatus(`Balance: ${balance.amount} ${balance.denom}`);
    } else {
      setStatus("No balance found");
    }
  } catch (error) {
    setStatus(`Balance check failed: ${error.message}`);
  }
};

export const handleClaim = async (user, points, xionClient, XION_CONFIG, setTxHash, setPoints, setStatus, isMock) => {
  if (!user?.xionAddress || points === 0) return;

  try {
    setStatus(isMock ? 'Simulating...' : 'Processing...');
    const result = await xionClient.sendTokens(
      XION_CONFIG.treasuryAddress,
      user.xionAddress,
      [{ denom: XION_CONFIG.denom, amount: points.toString() }],
      {
        amount: [{ denom: XION_CONFIG.denom, amount: "500" }],
        gas: "100000"
      }
    );

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