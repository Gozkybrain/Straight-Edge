import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Bip39, stringToPath } from "@cosmjs/crypto";

const RPC_ENDPOINT = "https://xion-testnet-rpc.polkachu.com:443"; // XION Testnet RPC

/**
 * Validates the mnemonic phrase
 */
function validateMnemonic(mnemonic) {
  mnemonic = mnemonic.trim().replace(/\s+/g, " "); // Normalize spaces

  const words = mnemonic.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length)) {
    throw new Error(`Invalid mnemonic length (${words.length} words). Expected 12, 15, 18, 21, or 24 words.`);
  }

  try {
    Bip39.decode(mnemonic); // Will throw an error if invalid
  } catch (error) {
    throw new Error("Invalid mnemonic: " + error.message);
  }

  return mnemonic;
}

/**
 * Retrieves the wallet address from the mnemonic
 */
export async function getWalletAddress(mnemonic) {
  try {
    mnemonic = validateMnemonic(mnemonic);

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "xion",
      hdPaths: [stringToPath("m/44'/118'/0'/0/0")], // Cosmos-based HD path
    });

    const [account] = await wallet.getAccounts();
    return account.address;
  } catch (error) {
    console.error("Error deriving wallet address:", error);
    return null;
  }
}

/**
 * Fetches the balance of a given wallet address
 */
export async function getBalance(address) {
  try {
    const client = await StargateClient.connect(RPC_ENDPOINT);
    const balance = await client.getBalance(address, "uxion"); // uxion = smallest unit of XION
    return balance.amount / 1e6; // Convert from uxion to XION
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

/**
 * Claims rewards by sending a transaction
 */
export async function claimRewards(mnemonic, amount) {
  try {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Mnemonic is required and must be a string.");
    }

    console.log("🔹 Validating Mnemonic...");
    mnemonic = validateMnemonic(mnemonic);

    console.log("🔹 Deriving Wallet Address...");
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "xion",
      hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
    });

    const [account] = await wallet.getAccounts();
    console.log("✅ Derived Address:", account.address);

    console.log("🔹 Connecting to SigningStargateClient...");
    const client = await SigningStargateClient.connectWithSigner(RPC_ENDPOINT, wallet);
    console.log("✅ Connected to RPC:", RPC_ENDPOINT);

    const fee = {
      amount: [{ denom: "uxion", amount: "5000" }], // Fixed fee of 5000 uxion
      gas: "200000",
    };

    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: account.address,
        toAddress: "xion1k0xf47x3ypde2r65x3gujp26q0lqd940am89s5k5xgr49d6ksrrsdxgy3g", // Target contract
        amount: [{ denom: "uxion", amount: (amount * 1e6).toFixed(0) }], // Convert amount to uxion
      },
    };

    console.log("🔹 Signing and Broadcasting Transaction...");
    const result = await client.signAndBroadcast(account.address, [msg], fee);
    console.log("✅ Transaction Successful! Hash:", result.transactionHash);

    return result.transactionHash;
  } catch (error) {
    console.error("❌ Error Claiming Rewards:", error);
    return null;
  }
}
