import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ClerkProvider } from "@clerk/clerk-react"; // Removed SignedIn/SignedOut

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // We removed StrictMode earlier, keep it removed
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {/* DIRECTLY RENDER APP - App.jsx will handle the logic */}
      <App />
  </ClerkProvider>
);