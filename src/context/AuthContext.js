import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage on mount
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (authToken, userData) => {
        // Attempt to merge with any locally saved profile data (like avatar)
        // because the mock/sample server might not persist profile images.
        const storedProfileStr = localStorage.getItem('studyhub_user_profile');
        let finalUserData = { ...userData };
        
        if (storedProfileStr) {
            try {
                const storedProfile = JSON.parse(storedProfileStr);
                // If it's the same user (by email or name), merge the avatar
                if (storedProfile.email === userData.email || storedProfile.name === userData.username) {
                    finalUserData = { ...userData, avatar: storedProfile.avatar, bio: storedProfile.bio };
                }
            } catch (e) {
                console.error("Error parsing local profile during login sync", e);
            }
        }

        setToken(authToken);
        setUser(finalUserData);
        localStorage.setItem("auth_token", authToken);
        localStorage.setItem("auth_user", JSON.stringify(finalUserData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem("auth_user", JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
