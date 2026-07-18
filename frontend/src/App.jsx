// src/App.jsx
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';

function App() {
  const [profile, setProfile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedProfile = localStorage.getItem('user_profile');
    const storedKey = localStorage.getItem('derived_key');
    const storedToken = localStorage.getItem('jwt_token');

    if (storedProfile && storedKey && storedToken) {
      setProfile(JSON.parse(storedProfile));
      setEncryptionKey(storedKey);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userProfile, derivedKey) => {
    setProfile(userProfile);
    setEncryptionKey(derivedKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('derived_key');
    localStorage.removeItem('user_profile');
    setProfile(null);
    setEncryptionKey(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading Sync Environment...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {!profile ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
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

          <button
            onClick={handleLogout}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Disconnect & Lock Account
          </button>
        </div>
      )}
    </div>
  );
}

export default App;