import React, { useState } from "react";
import { RefreshCw, RotateCcw, Star } from "lucide-react";
import "./Quiz.css";

function Quiz({ questions, onRestart, onSave, topic }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [userAnswers, setUserAnswers] = useState([]); // Track user choices

    // Reset state when new questions are loaded
    React.useEffect(() => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setShowResults(false);
        setUserAnswers([]);
    }, [questions]);

    if (!questions || questions.length === 0) {
        return (
            <div className="quiz-container">
                <p>No quiz questions available for this topic yet.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="quiz-restart-btn" onClick={onRestart}>Try Re-generating</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    let correctIdx = Number(currentQuestion.correctIndex);
    if (isNaN(correctIdx) && typeof currentQuestion.correctIndex === 'string') {
        const val = currentQuestion.correctIndex.trim();
        const char = val.toUpperCase();
        if (char === 'A') correctIdx = 0;
        else if (char === 'B') correctIdx = 1;
        else if (char === 'C') correctIdx = 2;
        else if (char === 'D') correctIdx = 3;
        else {
            correctIdx = currentQuestion.options.findIndex(opt => opt === val);
        }
    }
    if (isNaN(correctIdx) || correctIdx < 0) correctIdx = 0;

    const handleOptionClick = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        const isCorrect = index === correctIdx;
        if (isCorrect) {
            setScore(score + 1);
        }

        // Store the answer
        setUserAnswers(prev => [...prev, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctIndex: correctIdx,
            userIndex: index,
            isCorrect
        }]);

        // Move to next question after a delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                setShowResults(true);
            }
        }, 1500);
    };

    if (showResults) {
        const finalPercentage = Math.round((score / questions.length) * 100);
        return (
            <div className="quiz-container">
                <div className="quiz-results">
                    <div className="quiz-result-header">Quiz Complete!</div>
                    <p>You've finished the quiz on this topic.</p>

                    <div className="quiz-score-circle">
                        {finalPercentage}%
                    </div>

                    <p className="quiz-score-text">
                        You got <strong>{score}</strong> out of <strong>{questions.length}</strong> questions correct.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="quiz-restart-btn" onClick={onRestart}>
                            <RotateCcw size={16} /> Take Quiz Again
                        </button>
                        <button
                            className="quiz-restart-btn primary-save"
                            style={{ background: 'var(--primary)', border: 'none', shadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)' }}
                            onClick={() => onSave(`Quiz Results: ${topic} (${finalPercentage}%)`, {
                                score,
                                total: questions.length,
                                questions: userAnswers // Use the tracked answers with user selections
                            })}
                        >
                            <Star size={16} /> Save to Library
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            {/* Progress */}
            <div className="quiz-progress-wrap">
                <div className="quiz-progress-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button 
                            onClick={onRestart} 
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
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <RefreshCw size={14} /> Regenerate
                        </button>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                </div>
                <div className="quiz-progress-bar">
                    <div className="quiz-progress-fill" style={{ width: `${progress}% ` }}></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="quiz-question-card">
                <h3 className="quiz-question-text">{currentQuestion.question}</h3>

                <div className="quiz-options-list">
                    {currentQuestion.options.map((option, idx) => {
                        let statusClass = "";
                        if (isAnswered) {
                            if (idx === correctIdx) statusClass = "correct";
                            else if (idx === selectedOption) statusClass = "incorrect";
                        } else if (idx === selectedOption) {
                            statusClass = "selected";
                        }

                        const labels = ["A", "B", "C", "D"];

                        return (
                            <button
                                key={idx}
                                className={`quiz-option-btn ${statusClass}`}
                                onClick={() => handleOptionClick(idx)}
                                disabled={isAnswered}
                            >
                                <span className="quiz-option-index">{labels[idx]}</span>
                                <span className="quiz-option-text">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className={`quiz-feedback${selectedOption === correctIdx ? " correct" : " incorrect"}`}>
                        {selectedOption === correctIdx ? "✨ Correct! Well done." : "❌ Not quite. The correct answer is highlighted."}
                    </div>
                )}

            </div>
        </div>
    );
}

export default Quiz;
