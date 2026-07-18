// src/App.jsx
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ConsentSetup from './components/ConsentSetup';
import CardShuffler from './components/CardShuffler';
import { decryptData } from './utils/crypto';

// Adjust this port (5000 or 5001) to match your backend port configuration
const API_URL = 'http://localhost:5000/v1/cards/consent';

function App() {
  const [profile, setProfile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation views
  const [showConsentSetup, setShowConsentSetup] = useState(false);
  const [showShuffler, setShowShuffler] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const storedProfile = localStorage.getItem('user_profile');
      const storedKey = localStorage.getItem('derived_key');
      const storedToken = localStorage.getItem('jwt_token');

      if (storedProfile && storedKey && storedToken) {
        setProfile(JSON.parse(storedProfile));
        setEncryptionKey(storedKey);

        // Fetch existing boundaries to initialize memory state
        await fetchConsentBoundaries(storedToken, storedKey);
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const fetchConsentBoundaries = async (token, key) => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.encrypted_boundaries) {
        // Decrypt the payload locally using our key
        const decrypted = decryptData(data.encrypted_boundaries, key);
        if (decrypted) setBoundaries(decrypted);
      }
    } catch (err) {
      console.error('Failed to load secure boundaries.', err);
    }
  };

  const handleAuthSuccess = async (userProfile, derivedKey) => {
    setProfile(userProfile);
    setEncryptionKey(derivedKey);
    const token = localStorage.getItem('jwt_token');
    await fetchConsentBoundaries(token, derivedKey);
  };

  const handleConsentSaved = (newBoundaries) => {
    setBoundaries(newBoundaries);
    setShowConsentSetup(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('derived_key');
    localStorage.removeItem('user_profile');
    setProfile(null);
    setEncryptionKey(null);
    setBoundaries(null);
    setShowConsentSetup(false);
    setShowShuffler(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading Sync Environment...
      </div>
    );
  }

  // Router view logic
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  if (showConsentSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ConsentSetup
          derivedKey={encryptionKey}
          onSaveComplete={handleConsentSaved}
          onCancel={() => setShowConsentSetup(false)}
        />
      </div>
    );
  }

  if (showShuffler) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <CardShuffler
          boundaries={boundaries}
          onCancel={() => setShowShuffler(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Secure Connection Active
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Welcome to Freakasutra</h1>
          <p className="text-sm text-slate-400">Synchronized Profile Dashboard</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Account Name:</span>
            <span className="text-slate-200 font-medium">{profile.display_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Service Class:</span>
            <span className="text-pink-400 font-semibold uppercase">{profile.subscription_status}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Sync Status:</span>
            <span className="text-emerald-400 font-medium">
              {boundaries ? 'Boundaries Synchronized' : 'Boundaries Unconfigured'}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-slate-400">Local Derived Encryption Key:</span>
            <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {encryptionKey}
            </p>
            <span className="text-[10px] text-emerald-500/80">
              * Kept client-side only. Used to encrypt/decrypt intimacy metrics before synchronization.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {boundaries ? (
            <button
              onClick={() => setShowShuffler(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md"
            >
              Start Playing / Enter Shuffler
            </button>
          ) : (
            <button
              onClick={() => setShowConsentSetup(true)}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Configure Boundaries First
            </button>
          )}

          {boundaries && (
            <button
              onClick={() => setShowConsentSetup(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Edit Boundary Checklist
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Disconnect & Lock Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;