// src/components/ActiveTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { encryptData } from '../utils/crypto';

// Adjust this port (5000 or 5001) to match your backend port configuration
const API_URL = 'http://localhost:5000/v1/sessions/log';

export default function ActiveTimer({ card, derivedKey, onComplete, onCancel }) {
    const [timeLeft, setTimeLeft] = useState(card.suggested_duration_seconds);
    const [isActive, setIsActive] = useState(true);
    const [isPanic, setIsPanic] = useState(false);
    const [view, setView] = useState('play'); // 'play' or 'log'

    // Rating/Logging states
    const [completedStatus, setCompletedStatus] = useState('yes'); // 'yes', 'attempted', 'skipped'
    const [rating, setRating] = useState(5);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');

    const timerRef = useRef(null);
    const elapsedSeconds = useRef(0);

    // Countdown timer logic
    useEffect(() => {
        if (isActive && timeLeft > 0 && !isPanic && view === 'play') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                elapsedSeconds.current += 1;
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, isPanic, view]);

    // Handle timer completion
    useEffect(() => {
        if (timeLeft === 0 && view === 'play') {
            handleFinish();
        }
    }, [timeLeft, view]);

    const handleFinish = () => {
        setIsActive(false);
        setView('log');
    };

    const addOneMinute = () => {
        setTimeLeft((prev) => prev + 60);
    };

    const triggerPanic = () => {
        setIsActive(false);
        setIsPanic(true);
    };

    const handleSyncLog = async () => {
        setSyncing(true);
        setError('');
        const token = localStorage.getItem('jwt_token');

        // Generate precise current dates
        const now = new Date();
        const loggedDate = now.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'
        const loggedMonthYear = loggedDate.substring(0, 7); // Format 'YYYY-MM'

        try {
            // 1. Package the plaintext session stats
            const rawPayload = {
                card_id: card.card_id,
                title: card.title,
                actual_duration_seconds: elapsedSeconds.current,
                rating: rating,
                completed_status: completedStatus
            };

            // 2. Encrypt the raw payload locally on the device using our derived key
            const ciphertext = encryptData(rawPayload, derivedKey);

            // 3. Post the ciphertext string to the API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    encrypted_payload: ciphertext,
                    logged_date: loggedDate,
                    logged_month_year: loggedMonthYear
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to sync log.');

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 🚨 THE PANIC MODE SCREEN (Subtle financial news placeholder)
    if (isPanic) {
        return (
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl font-sans text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global Markets Overview</span>
                    <span className="text-[10px] text-slate-600">LIVE Updates</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-400">S&P 500 Index</span>
                        <span className="text-emerald-500 font-mono">+0.42% (5,412.18)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-400">NASDAQ Composite</span>
                        <span className="text-emerald-500 font-mono">+0.89% (16,845.50)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-400">Dow Jones Industrial</span>
                        <span className="text-red-500 font-mono">-0.12% (39,122.30)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
                        Federal Reserve minutes indicate cautious approach toward rate adjustments. Market indices show mixed responses in mid-day trading sessions. Tech sector gains provide primary support for indices.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsPanic(false);
                        setIsActive(true);
                    }}
                    className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-500 py-2 rounded-lg text-xs"
                >
                    Return to App
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6">

            {view === 'play' ? (
                // TIMER PLAY VIEW
                <div className="space-y-6 text-center">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                        <span className="text-xs font-mono text-slate-400">Active Act</span>
                        {/* The Discreet Panic Button */}
                        <button
                            onClick={triggerPanic}
                            className="text-xs font-bold bg-slate-900 border border-slate-700 text-pink-500 hover:text-pink-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow"
                        >
                            <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping"></span>
                            Panic Exit
                        </button>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-mono text-pink-400 uppercase tracking-widest">{card.category}</span>
                        <h2 className="text-xl font-bold text-slate-100">{card.title}</h2>
                    </div>

                    {/* Active Media Window with Blur Toggle */}
                    <div className="aspect-video w-full bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 relative overflow-hidden">
                        <span className="text-xs text-slate-500">[ proprietary active loop playing ]</span>
                    </div>

                    {/* Large Countdown Clock */}
                    <div className="py-2">
                        <span className="font-mono text-5xl font-bold text-pink-500 tracking-wider">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Primary Gameplay Controls */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-lg text-xs transition-colors"
                        >
                            {isActive ? 'Pause' : 'Resume'}
                        </button>
                        <button
                            onClick={addOneMinute}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-lg text-xs transition-colors"
                        >
                            +1 Min
                        </button>
                        <button
                            onClick={handleFinish}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
                        >
                            Finish Early
                        </button>
                    </div>
                </div>
            ) : (
                // SESSION RATING & LOGGING VIEW
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-pink-500 font-mono tracking-wide">Sync Completed Act</h2>
                        <p className="text-xs text-slate-400">Complete this quick check to securely log metrics to your annual wrapped.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Completion Status Selector */}
                        <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Did you complete the act?</label>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {['yes', 'attempted', 'skipped'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setCompletedStatus(status)}
                                        className={`text-xs py-1.5 rounded-lg border font-semibold uppercase transition-all ${completedStatus === status
                                                ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enjoyment Emoji Rating */}
                        <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Enjoyment Vibe</label>
                            <div className="flex justify-between px-2 pt-2">
                                {[
                                    { value: 1, label: '👎' },
                                    { value: 2, label: '😐' },
                                    { value: 3, label: '👍' },
                                    { value: 4, label: '😏' },
                                    { value: 5, label: '🥵' }
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setRating(item.value)}
                                        className={`text-2xl p-1.5 rounded-lg transition-transform ${rating === item.value ? 'bg-pink-500/10 border border-pink-500 scale-125' : 'opacity-40 hover:opacity-100'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                        >
                            Cancel Sync
                        </button>
                        <button
                            onClick={handleSyncLog}
                            disabled={syncing}
                            className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md"
                        >
                            {syncing ? 'Syncing...' : 'Encrypt & Sync'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}