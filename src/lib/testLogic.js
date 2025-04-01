import { auth, db } from './firebase';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import {
    signOut,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword  
} from 'firebase/auth'; 


/**
 * Generates a new XION wallet for the user
 * @returns {Object} Wallet address and mnemonic phrase
 */

export const generateUserWallet = async () => {
  const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: "xion" });
  const [account] = await wallet.getAccounts();
  return {
    address: account.address,
    mnemonic: wallet.mnemonic
  };
};


/**
 * Handles user registration flow:
 * 1. Creates XION wallet
 * 2. Creates Firebase auth user
 * 3. Saves user data to Firestore
 * 4. Shows mnemonic phrase
 */
export const handleRegister = async (email, password, setUser, setStatus, setTempMnemonic, setShowMnemonic) => {
  try {
    setStatus('Creating account...');
    const { address, mnemonic } = await generateUserWallet();
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

        // Save user data to Firestore
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


/**
 * Handles user login with email/password
 */
export const handleLogin = async (email, password, setStatus) => {
  try {
    setStatus('Logging in...');
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    setStatus(`Login Error: ${error.message}`);
  }
};


/**
 * Handles user logout and resets app state
 */
export const handleLogout = async (setUser, setPoints, setTxHash, setStatus) => {
  await signOut(auth);
  setUser(null);
  setPoints(0);
  setTxHash('');
  setStatus('Ready');
};


/**
 * Increments user's points in Firestore and local state
 */
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

/**
 * Checks XION blockchain for user's token balance
 */
export const checkBalance = async (user, XION_CONFIG, setStatus) => {
  if (!user?.xionAddress) {
    setStatus("No Xion address found");
    return;
  }

  try {
    setStatus("Fetching balances...");
    const client = await SigningStargateClient.connect(XION_CONFIG.rpcEndpoint);
    
    // Get both balances in parallel
    const [userBalances, treasuryBalances] = await Promise.all([
      client.getAllBalances(user.xionAddress),
      client.getAllBalances(XION_CONFIG.treasuryAddress)
    ]);
    
    // Helper function to find the main balance
    const findMainBalance = (balances) => {
      return balances.find(b => 
        b.denom === XION_CONFIG.denom || 
        b.denom === "uxion" || 
        b.denom === "stake"
      ) || { amount: "0", denom: XION_CONFIG.denom };
    };

    const userBalance = findMainBalance(userBalances);
    const treasuryBalance = findMainBalance(treasuryBalances);

    setStatus(`
      Your Balance: ${userBalance.amount} ${userBalance.denom}
      Treasury Balance: ${treasuryBalance.amount} ${treasuryBalance.denom}
    `);
    
  } catch (error) {
    console.error("Balance check error:", error);
    setStatus(`Error fetching balances: ${error.message}`);
  }
};

/**
 * Sends collected points to blockchain
 */
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