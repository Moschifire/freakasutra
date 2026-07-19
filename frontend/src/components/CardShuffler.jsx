// src/components/CardShuffler.jsx
import React, { useState, useEffect } from 'react';

// Adjust the port (5000 or 5001) depending on which one your backend is running on
const API_URL = 'http://localhost:5000/v1/cards';

const CATEGORY_LABELS = {
    warmup: 'Breathing & Whispers',
    hetero: 'Anatomical Union (M/F)',
    homo_m: 'Anatomical Union (M/M)',
    homo_f: 'Anatomical Union (F/F)',
    kink: 'Sensation & Shadows',
    fetish: 'Thermal & Edge Play'
};

export default function CardShuffler({ boundaries, onStartAct, onCancel }) {
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isShuffling, setIsShuffling] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCards = async () => {
            const token = localStorage.getItem('jwt_token');
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Failed to fetch cards.');

                setCards(data.cards);
                filterCardsByConsent(data.cards);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCards();
    }, [boundaries]);

    // Exclude cards based on boundaries
    const filterCardsByConsent = (allCards) => {
        if (!boundaries) {
            setFilteredCards(allCards);
            return;
        }

        const eligible = allCards.filter(card => {
            const userChoice = boundaries[card.category];
            return userChoice !== 'no';
        });

        setFilteredCards(eligible);
    };

    const drawCard = () => {
        if (filteredCards.length === 0) return;

        setIsShuffling(true);
        setCurrentCard(null);

        // Simulate sensual card unveiling delay (700ms)
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * filteredCards.length);
            setCurrentCard(filteredCards[randomIndex]);
            setIsShuffling(false);
        }, 700);
    };

    if (loading) {
        return (
            <div className="max-w-md w-full bg-[#160d22]/90 p-8 rounded-3xl text-center text-rose-300/40 font-serif-elegant italic">
                Gathering paths of desire...
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-[#160d22]/90 border border-[#2d173d]/60 p-8 rounded-3xl shadow-2xl shadow-rose-950/10 backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center border-b border-[#2d173d]/20 pb-3">
                <button onClick={onCancel} className="text-xs text-rose-300/40 hover:text-rose-200 transition-colors">
                    ← Return to Dashboard
                </button>
                <span className="text-[9px] bg-[#0d0714] border border-[#2d173d]/30 text-[#d4a373] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    Sensation Pool: {filteredCards.length}
                </span>
            </div>

            {error && (
                <div className="bg-[#991b1b]/10 border border-[#991b1b]/30 text-rose-300 p-3 rounded-xl text-xs text-center">
                    {error}
                </div>
            )}

            {filteredCards.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                    <p className="text-rose-200/50 text-sm font-light">No explorations match your current boundary alignment.</p>
                    <p className="text-xs text-[#d4a373] hover:underline cursor-pointer" onClick={onCancel}>
                        Return and enable a category to play.
                    </p>
                </div>
            ) : !currentCard ? (
                // IDLE STATE: CARD PILE UNVEIL TRIGGER
                <div className="text-center py-12 space-y-8">
                    <div className="relative w-40 h-56 mx-auto flex items-center justify-center">
                        {/* Ambient Card Back glow effects */}
                        <div className="absolute inset-0 bg-[#881337]/10 border border-[#be123c]/10 rounded-2xl transform rotate-6 scale-95 transition-transform duration-500"></div>
                        <div className="absolute inset-0 bg-[#881337]/20 border border-[#be123c]/20 rounded-2xl transform -rotate-3 scale-98 transition-transform duration-500"></div>
                        <div
                            onClick={drawCard}
                            className="absolute inset-0 bg-[#0d0714] border-2 border-[#be123c]/40 rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-rose-950/20 cursor-pointer transform hover:scale-105 hover:border-[#be123c]/70 transition-all duration-500 ease-out group"
                        >
                            <span className="text-4xl font-serif-elegant text-[#e5b3b3] group-hover:text-white transition-colors duration-500">F</span>
                            <span className="text-[9px] text-[#d4a373] font-semibold tracking-widest uppercase mt-2">Freakasutra</span>
                        </div>
                    </div>

                    <button
                        onClick={drawCard}
                        disabled={isShuffling}
                        className="w-full bg-gradient-to-r from-[#881337] to-[#be123c] hover:from-[#be123c] hover:to-[#e11d48] text-rose-100 font-semibold py-3 px-6 rounded-xl transition-all duration-500 text-sm shadow-md"
                    >
                        {isShuffling ? 'Unveiling Sensation...' : 'Unveil Path of Desire'}
                    </button>
                </div>
            ) : (
                // CARD REVEAL SCREEN
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-[#0d0714] border border-[#2d173d]/30 rounded-2xl p-5 space-y-4 shadow-inner">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-[#d4a373] uppercase tracking-widest">
                                {CATEGORY_LABELS[currentCard.category] || currentCard.category}
                            </span>
                            <span className="text-[10px] text-rose-200/40 font-serif-elegant italic">
                                {currentCard.suggested_duration_seconds / 60} mins of focus
                            </span>
                        </div>

                        <h2 className="text-2xl font-serif-elegant text-rose-100 italic tracking-wide leading-tight">
                            {currentCard.title}
                        </h2>

                        {/* Glowing visual assets placeholder */}
                        <div className="aspect-video w-full bg-[#050308] rounded-xl flex items-center justify-center border border-[#2d173d]/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#881337]/5 animate-pulse"></div>
                            <span className="text-xs text-rose-300/20 font-serif-elegant italic">[ visual guidance ]</span>
                        </div>

                        <p className="text-xs text-rose-200/60 leading-relaxed bg-[#050308]/40 p-4 rounded-xl border border-[#2d173d]/10 font-light italic">
                            {currentCard.description}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={drawCard}
                            className="flex-1 bg-transparent hover:bg-rose-950/20 border border-[#2d173d]/45 text-rose-300/60 font-semibold py-2.5 px-4 rounded-xl transition-colors text-xs"
                        >
                            Seek Another Path
                        </button>
                        <button
                            onClick={() => onStartAct(currentCard)}
                            className="flex-1 bg-gradient-to-r from-[#15803d] to-[#166534] hover:from-[#166534] hover:to-[#14532d] text-emerald-100 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs shadow-md shadow-emerald-950/25"
                        >
                            Begin Intimacy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}