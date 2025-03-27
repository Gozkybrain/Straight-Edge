import { useState } from "react";
import { Buffer } from "buffer"; // ✅ Fix for Buffer issue
import { auth } from "./lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { generateMnemonic } from "bip39"; // ✅ Import mnemonic generator

window.Buffer = Buffer; // ✅ Ensure Buffer is available in browser

function GetAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ Generate and store mnemonic for new users
        const mnemonic = generateMnemonic();
        localStorage.setItem("mnemonic", mnemonic);
        console.log("Generated Mnemonic:", mnemonic); // Debugging
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      console.log("User Authenticated:", userCredential.user.email);
    } catch (error) {
      console.error("Auth Error:", error.message);
    }
  };

  return (
    <div>
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">{isRegistering ? "Register" : "Login"}</button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default GetAuth;
