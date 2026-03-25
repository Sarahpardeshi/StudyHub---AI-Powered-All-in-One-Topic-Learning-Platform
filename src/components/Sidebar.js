import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { useAuth } from "../context/AuthContext.js";
import { Plus, ChevronLeft, Clock, MoreHorizontal } from "lucide-react";

// A simple fetch for history - in a real app, maybe extract to a hook
const API_URL = "http://localhost:5006/api";

function Sidebar({ isOpen, toggleSidebar, onSelectTopic, onSelectHistoryItem, onNewChat, onOpenLibrary, history, setHistory }) {
    const { user, logout, token } = useAuth();
    console.log("Sidebar Debug - History prop:", history);
    console.log("Sidebar Debug - User:", user?.email, "Token exists:", !!token);

    const handleRename = async (id, oldTopic) => {
        const newTopic = prompt("Rename Search:", oldTopic);
        if (!newTopic || newTopic === oldTopic) return;
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ topic: newTopic }),
            });
            // Update local state (via prop)
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
                    <Plus size={18} className="sidebar-btn-icon" /> New Search
                </button>
                <button className="sidebar-close-btn" onClick={toggleSidebar} title="Close Sidebar">
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div className="sidebar-nav">
                <div className="nav-label"><Clock size={14} style={{ marginRight: '8px' }} /> Recent</div>
                <ul className="history-list">
                    {history && history.length > 0 ? (
                        history.map((item) => (
                            <li key={item._id} className="history-item">
                                <div className="history-link-wrap">
                                    <button className="history-btn" onClick={() => onSelectHistoryItem(item)}>
                                        {item.topic}
                                    </button>
                                    <div className="history-menu-trigger">
                                        <button className="history-dots-btn">
                                            <MoreHorizontal size={14} />
                                        </button>
                                        <div className="history-context-menu">
                                            <button onClick={(e) => { e.stopPropagation(); handleRename(item._id, item.topic); }}>Rename</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="danger">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="history-item-empty" style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            No recent searches
                        </li>
                    )}
                </ul>
            </div>

            <div className="sidebar-footer">
            </div>
        </aside>
    );
}

export default Sidebar;
