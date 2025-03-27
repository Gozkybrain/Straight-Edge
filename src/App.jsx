import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { auth } from "./lib/firebase"; // Ensure Firebase is configured
import GetAuth from "./GetAuth";
import GetUser from "./GetUser";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase Auth listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <GetAuth />} />
        <Route path="/dashboard" element={user ? <GetUser user={user} /> : <Navigate to="/auth" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
      </Routes>
    </Router>
  );
}

export default App;
