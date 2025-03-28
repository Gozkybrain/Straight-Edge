// lib/xion.js
import { XionSigningClient } from "xion/build/sdk";  // Path may vary—check repo structure

export const initializeXion = async () => {
  return await XionSigningClient.connect("https://xion-testnet.rpc.node");
};

export const getXionAddress = async (firebaseUser) => {
  const client = await initializeXion();
  return client.getAddressFromFirebaseUser(firebaseUser);
};