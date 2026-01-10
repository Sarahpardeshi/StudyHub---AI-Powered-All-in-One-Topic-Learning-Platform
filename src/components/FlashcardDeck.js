import React, { useState } from 'react';
import '../pages/Flashcards.css';

const Flashcard = ({ card, onFlip, isFlipped }) => {
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

const FlashcardDeck = ({ cards = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Safety check
    if (!cards || cards.length === 0) {
        return <div className="fc-deck-container" style={{ color: 'rgba(255,255,255,0.5)' }}>No flashcards available.</div>;
    }

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 200); // Wait for flip reset logic if needed, or just instant
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
                <span className="fc-progress">Card {currentIndex + 1} of {cards.length}</span>
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
