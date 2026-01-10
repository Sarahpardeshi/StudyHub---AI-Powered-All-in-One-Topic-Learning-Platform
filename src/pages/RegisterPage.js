import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.js";
import { registerUser, googleLogin } from "../services/authApi.js";
import "./Auth.css";

function RegisterPage({ onSwitchToLogin }) {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const validateForm = () => {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Invalid email format.");
            return false;
        }

        // Password validation: at least 6 chars, letters + numbers, 1 special char
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 6 chars, contain letters, numbers, and a special character (!@#$%^&*).");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        try {
            await registerUser(username, email, password);
            // Auto-login after register, or show success? Let's show success for now as per previous logic
            onSwitchToLogin(); // sending them to login is safer flow
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const data = await googleLogin(credentialResponse.credential);
            login(data.token, data.user);
        } catch (err) {
            setError("Google Login Failed");
        }
    };

    return (
        <div className="auth-box">
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="auth-field">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="auth-field">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="auth-field">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="auth-btn">
                    Sign Up
                </button>
            </form>

            <div className="auth-divider">OR</div>
            <div className="google-btn-wrapper">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google Login Failed")}
                    theme="filled_black"
                    shape="rectangular"
                />
            </div>

            <p className="auth-footer">
                Already have an account?{" "}
                <button className="link-btn" onClick={onSwitchToLogin}>
                    Log in
                </button>
            </p>
        </div>
    );
}

export default RegisterPage;
