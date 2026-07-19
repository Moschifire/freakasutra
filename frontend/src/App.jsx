// src/App.jsx
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ConsentSetup from './components/ConsentSetup';
import CardShuffler from './components/CardShuffler';
import ActiveTimer from './components/ActiveTimer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { decryptData } from './utils/crypto';

// Adjust these ports to match your running backend port configuration
const CONSENT_API_URL = 'http://localhost:5000/v1/cards/consent';
const UPGRADE_API_URL = 'http://localhost:5000/v1/auth/upgrade';

function App() {
  const [profile, setProfile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  // Navigation views
  const [showConsentSetup, setShowConsentSetup] = useState(false);
  const [showShuffler, setShowShuffler] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  // PWA Install Event state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const storedProfile = localStorage.getItem('user_profile');
      const storedKey = localStorage.getItem('derived_key');
      const storedToken = localStorage.getItem('jwt_token');

      if (storedProfile && storedKey && storedToken) {
        setProfile(JSON.parse(storedProfile));
        setEncryptionKey(storedKey);

        await fetchConsentBoundaries(storedToken, storedKey);
      }
      setLoading(false);
    };

    initializeApp();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const fetchConsentBoundaries = async (token, key) => {
    try {
      const response = await fetch(CONSENT_API_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.encrypted_boundaries) {
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

  const handleSessionLogged = () => {
    setActiveCard(null);
    setShowShuffler(true);
  };

  // 💳 MOCK PREMIUM UPGRADE FLOW
  const handleUpgradeAccount = async () => {
    setUpgrading(true);
    const token = localStorage.getItem('jwt_token');

    try {
      const response = await fetch(UPGRADE_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upgrade failed.');

      // Update local state and storage cache with elevated subscription status
      const updatedProfile = { ...profile, subscription_status: data.subscription_status };
      setProfile(updatedProfile);
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

      alert('Upgrade successful! You are now a Freakasutra Premium member.');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User installed Freakasutra');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
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
    setShowAnalytics(false);
    setActiveCard(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading Sync Environment...
      </div>
    );
  }

  // --- Router View Logic ---
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // 1. Active Timer View
  if (activeCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ActiveTimer
          card={activeCard}
          derivedKey={encryptionKey}
          onComplete={handleSessionLogged}
          onCancel={() => setActiveCard(null)}
        />
      </div>
    );
  }

  // 2. Consent Setup View
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

  // 3. Shuffler Deck View
  if (showShuffler) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <CardShuffler
          boundaries={boundaries}
          onStartAct={(card) => {
            setShowShuffler(false);
            setActiveCard(card);
          }}
          onCancel={() => setShowShuffler(false)}
        />
      </div>
    );
  }

  // 4. Decrypted Analytics View
  if (showAnalytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AnalyticsDashboard
          derivedKey={encryptionKey}
          onCancel={() => setShowAnalytics(false)}
        />
      </div>
    );
  }

  // Default Dashboard View
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

        {/* PWA Installer Prompt */}
        {showInstallBtn && (
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 flex flex-col gap-2.5 text-center">
            <span className="text-xs text-pink-400 font-semibold">Install Freakasutra to your home screen for full standalone mobile play.</span>
            <button
              onClick={handleInstallPWA}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
            >
              Install App Now
            </button>
          </div>
        )}

        {/* 💳 PREMIUM TEASER / PAYWALL BOX */}
        {profile.subscription_status === 'free' && (
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Unlock Freakasutra Premium</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Elevate your intimate connection. Upgrade now to unlock advanced sensory Kink & Fetish decks, unlimited custom cards, and detailed intimacy analytics.
            </p>
            <button
              onClick={handleUpgradeAccount}
              disabled={upgrading}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white text-xs font-bold py-2 rounded-lg transition-colors"
            >
              {upgrading ? 'Authorizing Mock payment...' : 'Upgrade Now ($8/month)'}
            </button>
          </div>
        )}

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
              onClick={() => setShowAnalytics(true)}
              className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md"
            >
              View Intimacy Analytics & Wrapped
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