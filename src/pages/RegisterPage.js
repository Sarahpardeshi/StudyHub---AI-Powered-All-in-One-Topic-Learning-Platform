import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { GoogleLogin } from "@react-oauth/google";
import { registerUser, googleLogin } from "../services/authApi.js";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";

function RegisterPage({ onSwitchToLogin }) {
    const { login } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const getPasswordRequirements = (pass) => {
        const requirements = {
            length: pass.length >= 6,
            special: /[@_.!#$%^&*]/.test(pass)
        };
        return requirements;
    };

    const getStrengthLabel = () => {
        if (!password) return { text: "EMPTY", color: "#94a3b8", width: '0%' };
        const reqs = getPasswordRequirements(password);
        if (!reqs.length) return { text: "TOO SHORT", color: "#ef4444", width: '25%' };
        if (!reqs.special) return { text: "ADD SPECIAL CHAR", color: "#f59e0b", width: '60%' };
        return { text: "STRONG", color: "#10b981", width: '100%' };
    };

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Invalid email format.");
            return false;
        }
        const reqs = getPasswordRequirements(password);
        if (!reqs.length) {
            setError("Password must be at least 6 characters.");
            return false;
        }
        if (!reqs.special) {
            setError("Password must contain at least one special character (@, _, ., !, etc).");
            return false;
        }
        return true;
    };

    const strength = getStrengthLabel();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!validateForm()) return;

        try {
            await registerUser(`${firstName} ${lastName}`.trim(), email, password);
            onSwitchToLogin();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        try {
            const data = await googleLogin(credentialResponse.credential);
            login(data.token, data.user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-form-wrapper">

            <div className="auth-form-header">
                <h2>Create Account</h2>
                <p>Join the next generation of learners.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="auth-row">
                    <div className="auth-field">
                        <label>First Name</label>
                        <input
                            type="text"
                            placeholder="John"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-field">
                        <label>Last Name</label>
                        <input
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="auth-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Password</label>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: strength.color, letterSpacing: '0.5px' }}>{strength.text}</span>
                    </div>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                </div>

                <div className="auth-strength-meter">
                    <div className="auth-strength-bar" style={{ width: strength.width, backgroundColor: strength.color, background: 'none' }}></div>
                </div>

                <div className="auth-checkbox-row">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.</label>
                </div>

                {error && <p className="auth-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="auth-btn-primary" style={{ background: '#4D55CC' }}>
                    Create My Account →
                </button>
            </form>

            <div className="auth-social-divider">
                <span>OR SIGN UP WITH</span>
            </div>

            <div className="auth-social-grid">
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Login Failed")}
                        theme="outline"
                        shape="pill"
                    />
                </div>
            </div>

            <p className="auth-footer-text">
                Already have an account?
                <button onClick={onSwitchToLogin}>Sign In</button>
            </p>
        </div>
    );
}

export default RegisterPage;
