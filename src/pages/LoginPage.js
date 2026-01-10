import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.js";
import { loginUser, googleLogin } from "../services/authApi.js";
import "./Auth.css";

function LoginPage({ onSwitchToRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        try {
            const data = await googleLogin(credentialResponse.credential);
            login(data.token, data.user);
        } catch (err) {
            setError("Google login failed. Try again.");
        }
    };

    return (
        <div className="auth-box">
            <h2>Welcome Back</h2>
            <form onSubmit={handleSubmit}>
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
                    Log In
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
                Don't have an account?{" "}
                <button className="link-btn" onClick={onSwitchToRegister}>
                    Sign up
                </button>
            </p>
        </div>
    );
}

export default LoginPage;
