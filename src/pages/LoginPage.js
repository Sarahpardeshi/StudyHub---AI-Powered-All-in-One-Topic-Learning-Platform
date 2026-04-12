import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser, googleLogin } from "../services/authApi.js";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";

function LoginPage({ onSwitchToRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const data = await loginUser(email, password);
            login(data.token, data.user);
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
                <h2>Welcome Back</h2>
                <p>Resume your deep study session in seconds.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="auth-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="name@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="auth-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Password</label>
                        <button type="button" className="link-btn" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Forgot?</button>
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

                <div className="auth-checkbox-row">
                    <input type="checkbox" id="keep-logged" />
                    <label htmlFor="keep-logged">Keep me logged in for 30 days</label>
                </div>

                {error && <p className="auth-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="auth-btn-primary" style={{ backgroundColor: '#4D55CC' }}>
                    Enter Workspace →
                </button>
            </form>

            <div className="auth-social-divider">
                <span>OR CONTINUE WITH</span>
            </div>

            <div className="auth-social-grid">
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Login Failed")}
                        useOneTap
                        theme="outline"
                        shape="pill"
                    />
                </div>
            </div>

            <p className="auth-footer-text">
                Don't have an account?
                <button onClick={onSwitchToRegister}>Create Account</button>
            </p>
        </div>
    );
}

export default LoginPage;
