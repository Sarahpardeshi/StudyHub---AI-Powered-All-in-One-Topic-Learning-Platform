import React, { useState } from "react";
import "./Sidebar.css";
import { useAuth } from "../context/AuthContext.js";
import { Plus, Clock, MoreHorizontal, Menu, LogOut } from "lucide-react";

// A simple fetch for history - in a real app, maybe extract to a hook
const API_URL = "http://localhost:5006/api";

function Sidebar({ isOpen, toggleSidebar, onSelectTopic, onSelectHistoryItem, onNewChat, onOpenLibrary, history, setHistory }) {
    const { user, logout, token } = useAuth();
    console.log("Sidebar Debug - History prop:", history);
    console.log("Sidebar Debug - User:", user?.email, "Token exists:", !!token);

    const [toastMessage, setToastMessage] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editTopicText, setEditTopicText] = useState("");

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleRenameSubmit = async (id, oldTopic) => {
        const newTopic = editTopicText.trim();
        setEditingItem(null);
        if (!newTopic || newTopic === oldTopic) return;
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ topic: newTopic }),
            });
            setHistory(history.map(h => h._id === id ? { ...h, topic: newTopic } : h));
            showToast("Search renamed!");
        } catch (err) {
            console.error("Rename failed", err);
            showToast("Failed to rename search");
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setHistory(history.filter(h => h._id !== id));
            showToast("Search deleted!");
        } catch (err) {
            console.error("Delete failed", err);
            showToast("Failed to delete search");
        }
    };

    return (
        <aside className={`sidebar ${!isOpen ? "closed" : ""}`}>
            <div className="sidebar-header-row">
                <button className="new-chat-btn" onClick={onNewChat}>
                    <Plus size={18} className="sidebar-btn-icon" /> New Search
                </button>
                <button className="sidebar-close-btn" onClick={toggleSidebar} title="Close Sidebar">
                    <Menu size={20} />
                </button>
            </div>

            <div className="sidebar-nav">
                <div className="nav-label"><Clock size={14} style={{ marginRight: '8px' }} /> HISTORY</div>
                <ul className="history-list">
                    {history && history.length > 0 ? (
                        history.map((item) => (
                            <li key={item._id} className="history-item">
                                <div className="history-link-wrap">
                                    {editingItem === item._id ? (
                                        <input
                                            autoFocus
                                            value={editTopicText}
                                            onChange={(e) => setEditTopicText(e.target.value)}
                                            onBlur={() => handleRenameSubmit(item._id, item.topic)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameSubmit(item._id, item.topic);
                                                if (e.key === 'Escape') setEditingItem(null);
                                            }}
                                            style={{
                                                flex: 1, padding: "8px 10px", margin: "2px 0",
                                                border: "1px solid var(--primary)", borderRadius: "4px",
                                                outline: "none", fontSize: "0.9rem", color: "var(--text)"
                                            }}
                                        />
                                    ) : (
                                        <button className="history-btn" onClick={() => onSelectHistoryItem(item)}>
                                            {item.topic}
                                        </button>
                                    )}
                                    <div className="history-menu-trigger">
                                        <button className="history-dots-btn">
                                            <MoreHorizontal size={14} />
                                        </button>
                                        <div className="history-context-menu">
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItem(item._id);
                                                setEditTopicText(item.topic);
                                            }}>Rename</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="danger">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="history-item-empty" style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            No history
                        </li>
                    )}
                </ul>
            </div>

            <div className="sidebar-footer">
                {user && (
                    <div className="user-profile">
                        {user.avatar ? (
                            <img src={user.avatar} alt="avatar" className="user-avatar-img" />
                        ) : (
                            <div className="user-avatar">{user.username?.[0]?.toUpperCase() || "U"}</div>
                        )}
                        <span className="username">{user.username}</span>
                        <button className="logout-btn" onClick={logout} title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>

            {toastMessage && (
                <div className="toast-notification">
                    ✓ {toastMessage}
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
