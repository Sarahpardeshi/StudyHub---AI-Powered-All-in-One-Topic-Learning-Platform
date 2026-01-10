import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage.js';
import RegisterPage from './RegisterPage.js';
import './Auth.css';

import logo from '../assets/notes_hub_logo.png';

const AuthPage = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [introComplete, setIntroComplete] = useState(false);

    useEffect(() => {
        // "Sliding Door" Animation Trigger
        const timer = setTimeout(() => {
            setIntroComplete(true);
        }, 2000); // 2s pause as requested
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`auth-split-layout ${introComplete ? 'intro-complete' : ''}`}>
            <div className="auth-left-panel">
                <div className="auth-bg-orb auth-bg-orb--1" />
                <div className="auth-bg-orb auth-bg-orb--2" />

                <div className="auth-logo-content">
                    <div className="auth-logo-circle">
                        <img src={logo} alt="Notes Hub Logo" className="auth-logo-img" />
                    </div>
                    <h1 className="auth-welcome-title">Welcome to Notes Hub</h1>
                    <p className="auth-welcome-text">Your AI-powered knowledge companion.</p>
                </div>
            </div>

            {/* Right Panel: Login/Signup Flip */}
            <div className="auth-right-panel">
                <div className={`auth-flip-wrapper ${isFlipped ? 'flipped' : ''}`}>
                    <div className="auth-card-face auth-front">
                        <LoginPage onSwitchToRegister={() => setIsFlipped(true)} />
                    </div>
                    <div className="auth-card-face auth-back">
                        <RegisterPage onSwitchToLogin={() => setIsFlipped(false)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
