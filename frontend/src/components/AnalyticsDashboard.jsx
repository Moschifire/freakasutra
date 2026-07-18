// src/components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { decryptData } from '../utils/crypto';

// Adjust this port (5000 or 5001) to match your backend port configuration
const API_URL = 'http://localhost:5000/v1/sessions';

export default function AnalyticsDashboard({ derivedKey, onCancel }) {
    const [logs, setLogs] = useState([]);
    const [decryptedStats, setDecryptedStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [viewTab, setViewTab] = useState('monthly'); // 'monthly' or 'wrapped'

    useEffect(() => {
        const fetchAndCompileStats = async () => {
            const token = localStorage.getItem('jwt_token');
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Failed to fetch logs.');

                setLogs(data.logs);
                compileClientStats(data.logs);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAndCompileStats();
    }, [derivedKey]);

    // Client-Side Zero-Knowledge Compiler
    const compileClientStats = (encryptedLogs) => {
        if (encryptedLogs.length === 0) {
            setDecryptedStats(null);
            return;
        }

        let totalDuration = 0;
        let completedCount = 0;
        const categoryCounts = {};
        const ratings = [];

        // Loop and decrypt each log locally
        encryptedLogs.forEach(log => {
            const decrypted = decryptData(log.encrypted_payload, derivedKey);
            if (decrypted) {
                totalDuration += decrypted.actual_duration_seconds || 0;
                if (decrypted.completed_status === 'yes') completedCount++;

                // Count categories
                const cat = decrypted.title ? decrypted.title : 'Unknown';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

                if (decrypted.rating) ratings.push(decrypted.rating);
            }
        });

        // Find favorite act
        let favoriteAct = 'None';
        let maxCount = 0;
        Object.keys(categoryCounts).forEach(act => {
            if (categoryCounts[act] > maxCount) {
                maxCount = categoryCounts[act];
                favoriteAct = act;
            }
        });

        // Calculate Average Rating
        const avgRating = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
            : 'N/A';

        // Determine Intimacy Persona
        let persona = 'The Thoughtful Connector';
        if (favoriteAct.toLowerCase().includes('sensory') || favoriteAct.toLowerCase().includes('blindfold')) {
            persona = 'The Wild Adventurer';
        } else if (favoriteAct.toLowerCase().includes('lotus') || favoriteAct.toLowerCase().includes('bridge')) {
            persona = 'The Classic Harmony Seeker';
        }

        setDecryptedStats({
            totalSessions: encryptedLogs.length,
            completedCount,
            totalPlayMinutes: Math.round(totalDuration / 60),
            favoriteAct,
            avgRating,
            persona
        });
    };

    if (loading) {
        return (
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl text-center text-slate-400">
                Decrypting secure metrics...
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-200">
                    ← Back to Dashboard
                </button>
                <span className="text-[10px] bg-slate-900 border border-slate-700 text-pink-400 px-2 py-0.5 rounded-full font-mono">
                    Logs Found: {logs.length}
                </span>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs text-center">
                    {error}
                </div>
            )}

            {!decryptedStats ? (
                <div className="text-center py-12 space-y-2">
                    <span className="text-3xl">📊</span>
                    <h2 className="text-sm font-semibold text-slate-300">No Play History Found</h2>
                    <p className="text-xs text-slate-400">Complete intimacy card sessions to compile your monthly reports.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Dashboard Tab Toggles */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl">
                        <button
                            onClick={() => setViewTab('monthly')}
                            className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${viewTab === 'monthly'
                                    ? 'bg-slate-800 text-pink-400 shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Monthly Report
                        </button>
                        <button
                            onClick={() => setViewTab('wrapped')}
                            className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${viewTab === 'wrapped'
                                    ? 'bg-pink-600 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Freak Wrapped
                        </button>
                    </div>

                    {viewTab === 'monthly' ? (
                        // 📊 MONTHLY FREAK REPORT VIEW
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl text-center">
                                    <span className="text-[10px] text-slate-400 uppercase font-mono">Total Draws</span>
                                    <p className="text-2xl font-bold text-slate-100 mt-1">{decryptedStats.totalSessions}</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl text-center">
                                    <span className="text-[10px] text-slate-400 uppercase font-mono">Completions</span>
                                    <p className="text-2xl font-bold text-emerald-400 mt-1">{decryptedStats.completedCount}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Playtime:</span>
                                    <span className="text-slate-200 font-bold">{decryptedStats.totalPlayMinutes} Minutes</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Average Session Rating:</span>
                                    <span className="text-amber-400 font-bold">{decryptedStats.avgRating} / 5.0</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Top Position Completed:</span>
                                    <span className="text-pink-400 font-bold">{decryptedStats.favoriteAct}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 🔥 FREAK WRAPPED VIEW (STYLIZED RECAPPING)
                        <div className="bg-gradient-to-b from-pink-900/40 to-slate-950 border border-pink-500/30 rounded-2xl p-6 text-center space-y-6 animate-scale-up">
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest font-bold">2026 RECAP</span>
                                <h3 className="text-lg font-bold text-slate-100">Your Intimacy Persona</h3>
                            </div>

                            {/* Persona Graphic */}
                            <div className="w-24 h-24 mx-auto rounded-full bg-pink-500/10 border-2 border-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/10">
                                <span className="text-4xl">⚡</span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-md font-bold text-pink-400 font-mono">{decryptedStats.persona}</p>
                                <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                                    You approach intimacy with focus and awareness. Your preference for <span className="text-slate-200 font-semibold">"{decryptedStats.favoriteAct}"</span> highlights your dedication to exploring deeper connections.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-4">
                                <div className="text-left bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                                    <span className="text-slate-400 text-[9px] uppercase block font-mono">Minutes Logged</span>
                                    <span className="text-slate-100 font-bold text-sm">{decryptedStats.totalPlayMinutes}</span>
                                </div>
                                <div className="text-left bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                                    <span className="text-slate-400 text-[9px] uppercase block font-mono">Milestone Acts</span>
                                    <span className="text-pink-400 font-bold text-sm">{decryptedStats.completedCount}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}