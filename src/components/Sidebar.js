import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { useAuth } from "../context/AuthContext.js";
// A simple fetch for history - in a real app, maybe extract to a hook
const API_URL = "http://localhost:5006/api";

function Sidebar({ isOpen, toggleSidebar, onSelectTopic, onNewChat, onOpenLibrary }) {
    const { user, logout, token } = useAuth();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/history`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setHistory(data);
            })
            .catch(console.error);
    }, [token]);

    const handleRename = async (id, oldTopic) => {
        const newTopic = prompt("Rename Search:", oldTopic);
        if (!newTopic || newTopic === oldTopic) return;
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ topic: newTopic }),
            });
            // Update local state
            setHistory(history.map(h => h._id === id ? { ...h, topic: newTopic } : h));
        } catch (err) {
            console.error("Rename failed", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this history item?")) return;
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setHistory(history.filter(h => h._id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <aside className={`sidebar ${!isOpen ? "closed" : ""}`}>
            <div className="sidebar-header-row">
                <button className="new-chat-btn" onClick={onNewChat}>
                    <span className="plus-icon">+</span> New Search
                </button>
                <button className="sidebar-close-btn" onClick={toggleSidebar} title="Close Sidebar">
                    ❮
                </button>
            </div>

            <div className="sidebar-nav">
                <div className="nav-label">Recent</div>
                <ul className="history-list">
                    {history.map((item) => (
                        <li key={item._id} className="history-item">
                            <div className="history-link-wrap">
                                <button className="history-btn" onClick={() => onSelectTopic(item.topic)}>
                                    {item.topic}
                                </button>
                                <div className="history-menu-trigger">
                                    <span className="dots-icon">•••</span>
                                    <div className="history-context-menu">
                                        <button onClick={(e) => { e.stopPropagation(); handleRename(item._id, item.topic); }}>Rename</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="danger">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sidebar-footer">
                <button className="nav-link" onClick={onOpenLibrary}>
                    📚 My Library
                </button>
                <div className="user-profile">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="User" className="user-avatar-img" />
                    ) : (
                        <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                    )}
                    <span className="username">{user?.username}</span>
                    <button className="logout-btn" onClick={logout} title="Logout">
                        ⏻
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
