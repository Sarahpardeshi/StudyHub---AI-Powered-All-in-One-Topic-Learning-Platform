import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import '../pages/Flashcards.css';

const Flashcard = ({ card, onFlip, isFlipped }) => {
    if (!card) return null;
    return (
        <div className="fc-card-container" onClick={onFlip}>
            <div className={`fc-card ${isFlipped ? 'flipped' : ''}`}>
                <div className="fc-face fc-front">
                    <div className="fc-question-text">{card.question}</div>
                    <div className="fc-hint">
                        <span className="fc-hint-icon">↻</span> Press to flip
                    </div>
                </div>
                <div className="fc-face fc-back">
                    <div className="fc-answer-text">{card.answer}</div>
                    <div className="fc-hint">
                        <span className="fc-hint-icon">↻</span> Press to flip back
                    </div>
                </div>
            </div>
        </div>
    );
};

const FlashcardDeck = ({ cards = [], onRegenerate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Safety check
    if (!cards || cards.length === 0) {
        return (
            <div className="fc-deck-container" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <p style={{ color: '#64748B' }}>No flashcards available for this topic yet.</p>
                {onRegenerate && (
                    <button onClick={onRegenerate} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                        Try Re-generating
                    </button>
                )}
            </div>
        );
    }

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 200);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const currentCard = cards[currentIndex];

    return (
        <div className="fc-deck-container">
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '600px', marginBottom: '15px' }}>
                {onRegenerate && (
                    <button 
                        onClick={onRegenerate} 
                        className="fc-regenerate-btn"
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--primary)', 
                            cursor: 'pointer', 
                            fontSize: '13px', 
                            fontWeight: '700', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                            opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.opacity = '0.8';
                        }}
                    >
                        <RefreshCw size={14} /> Regenerate
                    </button>
                )}
            </div>
            <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
            />

            <div className="fc-controls">
                <button
                    className="fc-nav-btn"
                    onClick={handlePrev}
                    disabled={cards.length <= 1}
                >
                    ←
                </button>
                <span className="fc-progress">{currentIndex + 1} / {cards.length}</span>
                <button
                    className="fc-nav-btn"
                    onClick={handleNext}
                    disabled={cards.length <= 1}
                >
                    →
                </button>
            </div>
        </div>
    );
};

export default FlashcardDeck;
