// src/components/Auth.jsx
import React, { useState } from 'react';
import { hashEmailClient, deriveKey } from '../utils/crypto';

const API_URL = 'http://localhost:5000/v1/auth';

export default function Auth({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Calculate the stable salt locally using the email hash
            const salt = hashEmailClient(email);

            // 2. Derive the encryption key locally from the password
            const clientEncryptionKey = deriveKey(password, salt);

            // 3. Make HTTP request to backend
            const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Connection failed.');
            }

            // 4. On success, save JWT and the client-derived key to memory/storage
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('derived_key', clientEncryptionKey); // Stored locally, never sent to server
            localStorage.setItem('user_profile', JSON.stringify(data.profile));

            // 5. Trigger success callback
            onAuthSuccess(data.profile, clientEncryptionKey);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-pink-500">Cloud Sync & Backup Portal</h1>
                <p className="text-sm text-slate-400">
                    {isLogin
                        ? 'Access your synced settings, progress, and secure logs.'
                        : 'Initialize a secure, encrypted backup account.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Sync Email
                    </label>
                    <input
                        type="email"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-pink-500 text-sm"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Access Password
                    </label>
                    <input
                        type="password"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-pink-500 text-sm"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                    {loading ? 'Processing Sync...' : isLogin ? 'Connect Account' : 'Initialize Backup'}
                </button>
            </form>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => {
                        setError('');
                        setIsLogin(!isLogin);
                    }}
                    className="text-xs text-pink-400 hover:underline"
                >
                    {isLogin ? 'Need to initialize a new backup account?' : 'Already have a sync account? Connect here.'}
                </button>
            </div>
        </div>
    );
}