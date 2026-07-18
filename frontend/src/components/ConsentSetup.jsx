// src/components/ConsentSetup.jsx
import React, { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';

const API_URL = 'http://localhost:5000/v1/cards/consent';

const CATEGORIES = [
    { id: 'warmup', label: 'Warm-Up & Breathing', desc: 'Non-explicit connection and breathing exercises.' },
    { id: 'hetero', label: 'Heterosexual Positions', desc: 'Standard anatomical positions tailored for male/female partners.' },
    { id: 'homo_m', label: 'M/M Intimacy Positions', desc: 'Anatomical configurations designed for male/male partners.' },
    { id: 'homo_f', label: 'F/F Intimacy Positions', desc: 'Anatomical configurations designed for female/female partners.' },
    { id: 'kink', label: 'Kink & Sensory play', desc: 'Sensory deprivation, blindfolds, and light impact play (Premium).' },
    { id: 'fetish', label: 'Fetishes & Temperature', desc: 'Temperature tracing and advanced sensory stimulations (Premium).' },
];

export default function ConsentSetup({ derivedKey, onSaveComplete, onCancel }) {
    const [boundaries, setBoundaries] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch existing encrypted boundaries on load
        const fetchExistingConsent = async () => {
            const token = localStorage.getItem('jwt_token');
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok && data.encrypted_boundaries) {
                    // Decrypt existing boundaries locally
                    const decrypted = decryptData(data.encrypted_boundaries, derivedKey);
                    if (decrypted) setBoundaries(decrypted);
                } else {
                    // Default all categories to 'yes' if none exist
                    const defaultBoundaries = {};
                    CATEGORIES.forEach(cat => { defaultBoundaries[cat.id] = 'yes'; });
                    setBoundaries(defaultBoundaries);
                }
            } catch (err) {
                setError('Failed to fetch existing boundaries.');
            } finally {
                setFetching(false);
            }
        };

        fetchExistingConsent();
    }, [derivedKey]);

    const handleSelection = (categoryId, choice) => {
        setBoundaries(prev => ({
            ...prev,
            [categoryId]: choice
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('jwt_token');

        try {
            // 1. Encrypt the boundaries locally on-device
            const ciphertext = encryptData(boundaries, derivedKey);

            // 2. Sync the raw encrypted string to the backend database
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ encrypted_boundaries: ciphertext })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to sync.');

            onSaveComplete(boundaries);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="max-w-lg w-full bg-slate-800 p-8 rounded-2xl text-center text-slate-400">
                Loading secure consent keys...
            </div>
        );
    }

    return (
        <div className="max-w-lg w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-pink-500 font-mono tracking-wide">Intimacy Boundaries</h1>
                <p className="text-xs text-slate-400">
                    Toggle Yes, Maybe, or No. Selected items are encrypted locally and will define your custom shuffle deck.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs text-center">
                    {error}
                </div>
            )}

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                        <div>
                            <span className="text-sm font-semibold text-slate-200">{cat.label}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {['yes', 'maybe', 'no'].map((choice) => {
                                const isActive = boundaries[cat.id] === choice;
                                let activeStyle = '';
                                if (isActive) {
                                    if (choice === 'yes') activeStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
                                    if (choice === 'maybe') activeStyle = 'bg-amber-500/10 border-amber-500 text-amber-400';
                                    if (choice === 'no') activeStyle = 'bg-red-500/10 border-red-500 text-red-400';
                                } else {
                                    activeStyle = 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700';
                                }

                                return (
                                    <button
                                        key={choice}
                                        onClick={() => handleSelection(cat.id, choice)}
                                        className={`border rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${activeStyle}`}
                                    >
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    {loading ? 'Encrypting & Syncing...' : 'Save & Sync'}
                </button>
            </div>
        </div>
    );
}