// src/components/CardShuffler.jsx
import React, { useState, useEffect } from 'react';

// Adjust the port (5000 or 5001) depending on which one your backend is running on
const API_URL = 'http://localhost:5000/v1/cards';

export default function CardShuffler({ boundaries, onCancel }) {
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

    // Exclude cards categorized under "no" in the user's boundary list
    const filterCardsByConsent = (allCards) => {
        if (!boundaries) {
            setFilteredCards(allCards);
            return;
        }

        const eligible = allCards.filter(card => {
            const userChoice = boundaries[card.category];
            return userChoice !== 'no'; // Exclude 'no', keep 'yes' and 'maybe'
        });

        setFilteredCards(eligible);
    };

    const drawCard = () => {
        if (filteredCards.length === 0) return;

        setIsShuffling(true);
        setCurrentCard(null);

        // Simulate physical card shuffling animation delay (600ms)
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * filteredCards.length);
            setCurrentCard(filteredCards[randomIndex]);
            setIsShuffling(false);
        }, 600);
    };

    if (loading) {
        return (
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl text-center text-slate-400">
                Loading cards directory...
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
                    Deck Size: {filteredCards.length} Cards
                </span>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs text-center">
                    {error}
                </div>
            )}

            {filteredCards.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                    <p className="text-slate-400 text-sm">No cards available based on your current boundary configuration.</p>
                    <p className="text-xs text-pink-400">Go back and enable at least one category to play.</p>
                </div>
            ) : !currentCard ? (
                // IDLE STATE: PROMPT USER TO SHUFFLE
                <div className="text-center py-12 space-y-6">
                    <div className="relative w-40 h-56 mx-auto flex items-center justify-center">
                        {/* Mock Card Stack Effect */}
                        <div className="absolute inset-0 bg-pink-900/20 border border-pink-500/10 rounded-xl transform rotate-6"></div>
                        <div className="absolute inset-0 bg-pink-800/20 border border-pink-500/20 rounded-xl transform -rotate-3"></div>
                        <div className="absolute inset-0 bg-slate-900 border-2 border-pink-500 rounded-xl flex flex-col items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-pointer" onClick={drawCard}>
                            <span className="text-4xl font-bold text-pink-500 font-mono">F</span>
                            <span className="text-[10px] text-pink-400 font-semibold tracking-widest uppercase mt-2">Freakasutra</span>
                        </div>
                    </div>

                    <button
                        onClick={drawCard}
                        disabled={isShuffling}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm w-full"
                    >
                        {isShuffling ? 'Shuffling Deck...' : 'Shuffle & Draw Card'}
                    </button>
                </div>
            ) : (
                // CARD REVEAL SCREEN
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-pink-400 uppercase tracking-widest">
                                {currentCard.category}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                Duration: {currentCard.suggested_duration_seconds / 60} min
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-100">{currentCard.title}</h2>

                        {/* Media Window Placeholder (Sprint 3 Integration) */}
                        <div className="aspect-video w-full bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-slate-500 text-xs">
                            [Proprietary Animation Placeholder]
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-950">
                            {currentCard.description}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={drawCard}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                            Draw Another
                        </button>
                        <button
                            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                            onClick={() => alert('Starting Timer (Built in Sprint 3)')}
                        >
                            Start Act
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}