import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { getBalance, claimRewards, getWalletAddress } from "./lib/blockchain";
import { signOut } from "firebase/auth";

const GetUser = () => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(() => {
    return parseFloat(localStorage.getItem("balance")) || 0;
  });
  const [localBalance, setLocalBalance] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]); // Fetch balance only when user is set

  const fetchBalance = async () => {
    if (!user) return;

    try {
      const mnemonic = localStorage.getItem("mnemonic");
      if (!mnemonic) {
        console.error("No mnemonic found for fetching balance!");
        return;
      }

      console.log("Fetching balance using mnemonic...");
      const walletAddress = await getWalletAddress(mnemonic);
      console.log("Derived Wallet Address:", walletAddress);

      if (!walletAddress) {
        console.error("Failed to derive wallet address.");
        return;
      }

      const fetchedBalance = await getBalance(walletAddress);
      console.log("Fetched balance:", fetchedBalance);

      setBalance(fetchedBalance);
      localStorage.setItem("balance", fetchedBalance); // Persist balance
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleAddFunds = () => {
    if (clicks < 10) {
      setLocalBalance((prev) => prev + 1.02);
      setClicks((prev) => prev + 1);
    }
  };

  const handleClaim = async () => {
    const mnemonic = localStorage.getItem("mnemonic");

    console.log("Retrieved Mnemonic:", mnemonic);

    if (!mnemonic) {
      console.error("No mnemonic found in localStorage!");
      return;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (![12, 15, 18, 21, 24].includes(words.length)) {
      console.error("Invalid mnemonic length:", words.length);
      return;
    }

    try {
      setLoading(true);
      console.log("Claiming rewards...");
      await claimRewards(mnemonic, 10);
      console.log("Claim successful! Fetching updated balance...");
      await fetchBalance();
    } catch (error) {
      console.error("Error claiming rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("mnemonic");
      localStorage.removeItem("userSession");
      localStorage.removeItem("balance"); // Clear stored balance on logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <h2>Welcome, {user.email}</h2>
          <p>Blockchain Balance: {balance} XION</p>
          <p>Pending Balance: {localBalance} XION</p>
          <button onClick={handleAddFunds} disabled={clicks >= 10}>
            Add 1.02 XION
          </button>
          {clicks >= 10 && (
            <button onClick={handleClaim} disabled={loading}>
              {loading ? "Processing..." : "Claim Rewards"}
            </button>
          )}
          <br />
          <button onClick={handleLogout} style={{ marginTop: "20px", background: "red", color: "white" }}>
            Logout
          </button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};

export default GetUser;