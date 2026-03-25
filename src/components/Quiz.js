import React, { useState } from "react";
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

    const handleOptionClick = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        const isCorrect = index === currentQuestion.correctIndex;
        if (isCorrect) {
            setScore(score + 1);
        }

        // Store the answer
        setUserAnswers(prev => [...prev, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctIndex: currentQuestion.correctIndex,
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

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="quiz-restart-btn" onClick={onRestart}>
                            Take Quiz Again
                        </button>
                        <button
                            className="quiz-restart-btn"
                            style={{ background: 'var(--primary)' }}
                            onClick={() => onSave(`Quiz Results: ${topic} (${finalPercentage}%)`, {
                                score,
                                total: questions.length,
                                questions: userAnswers // Use the tracked answers with user selections
                            })}
                        >
                            ★ Save to Library
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
                <div className="quiz-progress-label">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}% Complete</span>
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
                            if (idx === currentQuestion.correctIndex) statusClass = "correct";
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
                    <div className={`quiz-feedback${selectedOption === currentQuestion.correctIndex ? " correct" : " incorrect"}`}>
                        {selectedOption === currentQuestion.correctIndex ? "✨ Correct! Well done." : "❌ Not quite. The correct answer is highlighted."}
                    </div>
                )}

            </div>
        </div>
    );
}

export default Quiz;
