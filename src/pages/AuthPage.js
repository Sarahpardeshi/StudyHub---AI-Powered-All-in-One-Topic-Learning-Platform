import React, { useState } from 'react';
import LoginPage from './LoginPage.js';
import RegisterPage from './RegisterPage.js';
import './Auth.css';

import logo from "../assets/studyhub_logo.png";

const AuthPage = () => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="auth-split-layout">
            <div className="auth-left-panel">
                <div className="auth-left-content">
                    <div className="auth-left-logo">
                        <img src={logo} alt="StudyHub" style={{ width: '80px', height: '80px', marginRight: '16px', objectFit: 'contain' }} /> StudyHub
                    </div>

                    <h1 className="auth-headline">
                        Master your studies <br /> with the power of AI.
                    </h1>

                    <div className="auth-features">
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon">🧠</div>
                            <div className="auth-feature-text">
                                <h3>Adaptive Learning</h3>
                                <p>Personalized study paths that evolve with your progress.</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon">⚡</div>
                            <div className="auth-feature-text">
                                <h3>Deep Study Workspace</h3>
                                <p>Focus-optimized interface with integrated AI assistance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="auth-testimonial-card">
                        <div className="auth-testimonial-user">
                            <div className="auth-user-avatars">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="user" />
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="user" />
                            </div>
                            <div className="auth-testimonial-stats">
                                +12k students joined this week
                            </div>
                        </div>
                        <p className="auth-testimonial-quote">
                            "The AI-generated quizzes transformed my finals preparation. Highly recommended!"
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-container">
                    {!isFlipped ? (
                        <LoginPage onSwitchToRegister={() => setIsFlipped(true)} />
                    ) : (
                        <RegisterPage onSwitchToLogin={() => setIsFlipped(false)} />
                    )}
                </div>
            </div>
        </div >
    );
}

export default AuthPage;
