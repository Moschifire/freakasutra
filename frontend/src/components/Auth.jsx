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
            const salt = hashEmailClient(email);
            const clientEncryptionKey = deriveKey(password, salt);

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

            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('derived_key', clientEncryptionKey);
            localStorage.setItem('user_profile', JSON.stringify(data.profile));

            onAuthSuccess(data.profile, clientEncryptionKey);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-[#160d22]/90 border border-[#2d173d]/60 p-8 rounded-3xl shadow-2xl shadow-rose-950/10 backdrop-blur-md transition-all duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-serif-elegant text-[#e5b3b3] tracking-wide">
                    The Private Sanctuary
                </h1>
                <p className="text-xs text-rose-200/50 leading-relaxed max-w-xs mx-auto">
                    {isLogin
                        ? 'Step inside your private sanctuary to resume your sensory journey and unlock your shared limits.'
                        : 'Create your private space to safely align your deepest desires and secure your shared history.'}
                </p>
            </div>

            {error && (
                <div className="bg-[#991b1b]/10 border border-[#991b1b]/30 text-rose-300 p-3 rounded-xl text-xs text-center mt-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <div>
                    <label className="block text-[10px] font-semibold text-rose-300/40 uppercase tracking-widest mb-1.5">
                        Sanctuary ID (Email)
                    </label>
                    <input
                        type="email"
                        required
                        className="w-full bg-[#0d0714] border border-[#2d173d] rounded-xl px-4 py-3 text-rose-100 placeholder-rose-300/20 focus:outline-none focus:border-[#be123c]/60 text-sm transition-colors duration-300"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-semibold text-rose-300/40 uppercase tracking-widest mb-1.5">
                        The Whispered Key (Password)
                    </label>
                    <input
                        type="password"
                        required
                        className="w-full bg-[#0d0714] border border-[#2d173d] rounded-xl px-4 py-3 text-rose-100 placeholder-rose-300/20 focus:outline-none focus:border-[#be123c]/60 text-sm transition-colors duration-300"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#881337] to-[#be123c] hover:from-[#be123c] hover:to-[#e11d48] disabled:from-[#4c0519] disabled:to-[#881337] text-rose-100 font-semibold py-3 px-4 rounded-xl transition-all duration-500 ease-out text-sm shadow-md shadow-rose-950/20"
                >
                    {loading ? 'Opening Sanctuary...' : isLogin ? 'Enter Your Sanctuary' : 'Establish Your Sanctuary'}
                </button>
            </form>

            <div className="text-center pt-2">
                <button
                    type="button"
                    onClick={() => {
                        setError('');
                        setIsLogin(!isLogin);
                    }}
                    className="text-xs text-[#d4a373] hover:text-[#e5b3b3] transition-colors duration-300"
                >
                    {isLogin ? 'New here? Begin your sensory sanctuary.' : 'Returning? Resume your shared connection.'}
                </button>
            </div>
        </div>
    );
}