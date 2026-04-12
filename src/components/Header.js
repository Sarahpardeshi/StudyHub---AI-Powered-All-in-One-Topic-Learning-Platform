import React from "react";
import SearchBar from "./SearchBar.js";
import { Settings, Menu } from "lucide-react";
import "./Header.css";

import logo from "../assets/studyhub_logo.png";

function Header({ topic, onSearch, onHome, onOpenLibrary, onOpenExplore, onOpenWorkspace, onOpenSettings, view, user, logout, sidebarOpen, toggleSidebar }) {
    return (
        <header className="app-header">
            <div className="header-left">
                {!sidebarOpen && (
                    <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Open Sidebar">
                        <Menu size={20} />
                    </button>
                )}
                <div className="header-logo" onClick={onHome}>
                    <img src={logo} alt="logo" className="logo-img" />
                    <span>StudyHub</span>
                </div>
                <div className="header-search-mini">
                    <SearchBar onSearch={onSearch} placeholder="Search your library..." variant="mini" />
                </div>
            </div>

            <div className="header-right">
                <nav className="header-nav">
                    <button
                        className={`nav-link ${view === "landing" ? "active" : ""}`}
                        onClick={onHome}
                    >
                        Dashboard
                    </button>
                    {topic && (
                        <button
                            className={`nav-link ${view === "topic" ? "active" : ""}`}
                            onClick={onOpenWorkspace}
                        >
                            Workspace
                        </button>
                    )}
                    <button
                        className={`nav-link ${view === "library" ? "active" : ""}`}
                        onClick={onOpenLibrary}
                    >
                        Library
                    </button>
                    <button
                        className={`nav-link ${view === "explore" ? "active" : ""}`}
                        onClick={onOpenExplore}
                    >
                        Explore
                    </button>
                </nav>
                <div className="header-divider"></div>
                <div className="header-actions">
                    <div 
                        className={`header-user-profile ${view === "settings" ? "active" : ""}`} 
                        onClick={onOpenSettings} 
                        style={{ cursor: 'pointer' }}
                        title="Profile & Settings"
                    >
                        {user?.avatar && !user.avatar.includes('dicebear') ? (
                            <img src={user.avatar} alt="User" className="header-user-avatar-img" />
                        ) : (
                            <div className="header-user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
