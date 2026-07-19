// src/App.jsx
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ConsentSetup from './components/ConsentSetup';
import CardShuffler from './components/CardShuffler';
import ActiveTimer from './components/ActiveTimer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { decryptData } from './utils/crypto';

const API_URL = 'http://localhost:5000/v1/cards/consent';
const UPGRADE_API_URL = 'http://localhost:5000/v1/auth/upgrade';

function App() {
  const [profile, setProfile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const [showConsentSetup, setShowConsentSetup] = useState(false);
  const [showShuffler, setShowShuffler] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

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
      const response = await fetch(API_URL, {
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

      const updatedProfile = { ...profile, subscription_status: data.subscription_status };
      setProfile(updatedProfile);
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

      alert('Upgrade successful! Welcome to Freakasutra Premium.');
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

  // Convert cold database subscription statuses into warm, descriptive tiers
  const formatServiceClass = (status) => {
    if (status === 'free') return 'The Awakening (Free)';
    if (status === 'premium_monthly') return 'Deep Devotion (Premium)';
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-300/50 font-serif-elegant italic">
        Preparing Your Sanctuary...
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#160d22]/90 border border-[#2d173d]/60 p-8 rounded-3xl shadow-2xl shadow-rose-950/10 backdrop-blur-md space-y-6">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sanctuary Sealed
          </div>
          <h1 className="text-3xl font-serif-elegant text-[#e5b3b3] tracking-wide">
            Freakasutra
          </h1>
          <p className="text-xs text-rose-200/50">Your Private Intimacy Portal</p>
        </div>

        {/* PWA Installer Prompt */}
        {showInstallBtn && (
          <div className="bg-[#be123c]/10 border border-[#be123c]/20 rounded-2xl p-4 flex flex-col gap-2 text-center">
            <span className="text-[11px] text-rose-300">Install Freakasutra to your home screen for full standalone mobile play.</span>
            <button
              onClick={handleInstallPWA}
              className="bg-gradient-to-r from-[#881337] to-[#be123c] text-rose-100 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors"
            >
              Install App Now
            </button>
          </div>
        )}

        {/* 💳 PREMIUM UPGRADE BOX */}
        {profile.subscription_status === 'free' && (
          <div className="bg-[#0d0714] border border-[#2d173d]/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#d4a373]">
              <span className="text-md">✨</span>
              <span className="text-xs font-bold uppercase tracking-wider">Deepen Your Devotion</span>
            </div>
            <p className="text-[11px] text-rose-200/50 leading-relaxed font-light">
              Elevate your sensory journey. Unveil advanced sensory Kink & Fetish decks, design custom cards, and unlock your personal Wrapped recaps.
            </p>
            <button
              onClick={handleUpgradeAccount}
              disabled={upgrading}
              className="w-full bg-gradient-to-r from-[#881337] to-[#be123c] text-rose-100 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              {upgrading ? 'Connecting Devotion...' : 'Awaken Premium ($8/month)'}
            </button>
          </div>
        )}

        {/* Core Profile Metrics */}
        <div className="bg-[#0d0714] border border-[#2d173d]/30 rounded-2xl p-4 space-y-3.5 text-xs">
          <div className="flex justify-between border-b border-[#2d173d]/20 pb-2">
            <span className="text-rose-300/40 font-semibold tracking-wider uppercase text-[9px]">Intimacy Pseudonym</span>
            <span className="text-rose-200 font-medium">{profile.display_name}</span>
          </div>
          <div className="flex justify-between border-b border-[#2d173d]/20 pb-2">
            <span className="text-rose-300/40 font-semibold tracking-wider uppercase text-[9px]">Sensory Devotion</span>
            <span className="text-[#d4a373] font-bold uppercase">{formatServiceClass(profile.subscription_status)}</span>
          </div>
          <div className="flex justify-between border-b border-[#2d173d]/20 pb-2">
            <span className="text-rose-300/40 font-semibold tracking-wider uppercase text-[9px]">Desire Blueprint</span>
            <span className="text-emerald-400 font-medium">
              {boundaries ? 'Boundaries Aligned' : 'Unconfigured'}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-rose-300/40 font-semibold tracking-wider uppercase text-[9px]">The Whispered Seal (Encryption Key)</span>
            <p className="font-mono text-[9px] text-rose-300/40 break-all bg-[#09050d] p-2 rounded-lg border border-[#2d173d]/20">
              {encryptionKey}
            </p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-3">
          {boundaries ? (
            <button
              onClick={() => setShowShuffler(true)}
              className="w-full bg-gradient-to-r from-[#15803d] to-[#166534] hover:from-[#166534] hover:to-[#14532d] text-emerald-100 font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-md shadow-emerald-950/20"
            >
              Begin the Exploration
            </button>
          ) : (
            <button
              onClick={() => setShowConsentSetup(true)}
              className="w-full bg-gradient-to-r from-[#881337] to-[#be123c] text-rose-100 font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-md"
            >
              Map Your Desires First
            </button>
          )}

          {boundaries && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="w-full bg-rose-100/10 hover:bg-rose-100/15 text-rose-200 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm border border-rose-100/10"
            >
              Unveil Your Intimate Echoes
            </button>
          )}

          {boundaries && (
            <button
              onClick={() => setShowConsentSetup(true)}
              className="w-full bg-transparent hover:bg-rose-300/5 text-rose-300/70 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Refine Your Boundaries & Desires
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-rose-950/20 text-rose-400/40 hover:text-rose-400/80 font-semibold py-2 px-4 rounded-xl transition-colors text-[11px]"
          >
            Seal the Sanctuary
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;