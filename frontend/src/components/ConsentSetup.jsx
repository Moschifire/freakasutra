// src/components/ConsentSetup.jsx
import React, { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';

const API_URL = 'http://localhost:5000/v1/cards/consent';

const CATEGORIES = [
    { id: 'warmup', label: 'Breathing & Whispers', desc: 'Slow connection, coordinated breathing, and non-explicit sensory calibration.' },
    { id: 'hetero', label: 'Anatomical Union (M/F)', desc: 'Close-proximity, intimate positions tailored for male and female partners.' },
    { id: 'homo_m', label: 'Anatomical Union (M/M)', desc: 'Responsive positioning designed specifically for male/male partners.' },
    { id: 'homo_f', label: 'Anatomical Union (F/F)', desc: 'Lateral, close-proximity configurations designed for female/female partners.' },
    { id: 'kink', label: 'Sensation & Shadows', desc: 'Light sensory deprivation, blindfolds, and touch exploration (Premium).' },
    { id: 'fetish', label: 'Thermal & Edge Play', desc: 'Temperature tracing and advanced sensory stimulation (Premium).' },
];

export default function ConsentSetup({ derivedKey, onSaveComplete, onCancel }) {
    const [boundaries, setBoundaries] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchExistingConsent = async () => {
            const token = localStorage.getItem('jwt_token');
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok && data.encrypted_boundaries) {
                    const decrypted = decryptData(data.encrypted_boundaries, derivedKey);
                    if (decrypted) setBoundaries(decrypted);
                } else {
                    // Default all categories to 'yes' if none exist
                    const defaultBoundaries = {};
                    CATEGORIES.forEach(cat => { defaultBoundaries[cat.id] = 'yes'; });
                    setBoundaries(defaultBoundaries);
                }
            } catch (err) {
                setError('Failed to load your intimacy profile.');
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
            const ciphertext = encryptData(boundaries, derivedKey);

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
            <div className="max-w-lg w-full bg-[#160d22]/90 p-8 rounded-3xl text-center text-rose-300/40 font-serif-elegant italic">
                Unlocking intimacy keys...
            </div>
        );
    }

    return (
        <div className="max-w-lg w-full bg-[#160d22]/90 border border-[#2d173d]/60 p-8 rounded-3xl shadow-2xl shadow-rose-950/10 backdrop-blur-md space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-serif-elegant text-[#e5b3b3] tracking-wide">
                    Map Your Desires
                </h1>
                <p className="text-xs text-rose-200/50 leading-relaxed max-w-sm mx-auto">
                    Align your senses. Select what to embrace, what to explore, and what to keep outside the sanctuary. Your choices are encrypted locally on this device.
                </p>
            </div>

            {error && (
                <div className="bg-[#991b1b]/10 border border-[#991b1b]/30 text-rose-300 p-3 rounded-xl text-xs text-center">
                    {error}
                </div>
            )}

            {/* Checklist items scroll box with lower contrast warm scrollbar styling */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="bg-[#0d0714] border border-[#2d173d]/30 rounded-2xl p-5 space-y-3">
                        <div>
                            <span className="text-sm font-semibold text-rose-100">{cat.label}</span>
                            <p className="text-[11px] text-rose-200/40 mt-1 leading-relaxed">{cat.desc}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'yes', label: 'Embrace' },
                                { value: 'maybe', label: 'Explore' },
                                { value: 'no', label: 'Exclude' }
                            ].map((choice) => {
                                const isActive = boundaries[cat.id] === choice.value;
                                let activeStyle = '';

                                // Color cues for selected choices
                                if (isActive) {
                                    if (choice.value === 'yes') activeStyle = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
                                    if (choice.value === 'maybe') activeStyle = 'bg-amber-500/10 border-amber-500/40 text-[#d4a373]';
                                    if (choice.value === 'no') activeStyle = 'bg-rose-950/20 border-rose-800/40 text-rose-400';
                                } else {
                                    activeStyle = 'border-[#2d173d]/20 bg-[#09050d] text-rose-300/30 hover:border-[#2d173d]/60';
                                }

                                return (
                                    <button
                                        key={choice.value}
                                        onClick={() => handleSelection(cat.id, choice.value)}
                                        className={`border rounded-xl py-2 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${activeStyle}`}
                                    >
                                        {choice.label}
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
                    className="flex-1 bg-transparent hover:bg-rose-950/20 border border-[#2d173d]/40 text-rose-300/60 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                    Depart
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#881337] to-[#be123c] hover:from-[#be123c] hover:to-[#e11d48] text-rose-100 font-semibold py-2.5 px-4 rounded-xl transition-all duration-500 text-sm shadow-md"
                >
                    {loading ? 'Aligning...' : 'Align & Seal'}
                </button>
            </div>
        </div>
    );
}