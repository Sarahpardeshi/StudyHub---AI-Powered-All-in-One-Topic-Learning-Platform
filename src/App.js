import React, { useState, useEffect } from "react";
import "./App.css";
import LandingPage from "./pages/LandingPage.js";
import TopicPage from "./pages/TopicPage.js";
import AuthPage from "./pages/AuthPage.js";
import LibraryPage from "./pages/LibraryPage.js";
import SettingsPage from "./pages/SettingsPage.js";
import ExplorePage from "./pages/ExplorePage.js";
import Sidebar from "./components/Sidebar.js";
import Header from "./components/Header.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext.js";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Wrapper to handle conditional rendering based on auth
function AppContent() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  // Auth state now handled internally by AuthPage

  // Persist and Apply Global Accent Theme
  useEffect(() => {
    const savedAccentId = localStorage.getItem('studyhub_accent_id');
    if (savedAccentId) {
      const COLORS = [
        { id: "indigo", color: "#4F46E5", hover: "#4338CA", soft: "rgba(79, 70, 229, 0.1)" },
        { id: "purple", color: "#8B5CF6", hover: "#7C3AED", soft: "rgba(139, 92, 246, 0.1)" },
        { id: "teal", color: "#06B6D4", hover: "#0891B2", soft: "rgba(6, 182, 212, 0.1)" },
        { id: "pink", color: "#EC4899", hover: "#DB2777", soft: "rgba(236, 72, 153, 0.1)" },
        { id: "amber", color: "#F59E0B", hover: "#D97706", soft: "rgba(245, 158, 11, 0.1)" },
      ];
      const theme = COLORS.find(c => c.id === savedAccentId);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.color);
        root.style.setProperty('--primary-hover', theme.hover);
        root.style.setProperty('--primary-soft', theme.soft);
      }
    }
  }, []);

  // App views
  const [view, setView] = useState("landing"); // "landing" | "topic" | "library" | "settings" | "explore"
  const [topic, setTopic] = useState("");
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  const [initialTopicState, setInitialTopicState] = useState(null);

  // Fetch history on mount / Reset state on logout
  const fetchHistory = React.useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5006/api/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        console.warn("Session expired (401/403). Logging out...");
        logout();
        return;
      }
      if (!res.ok) {
        console.error(`History Fetch Failed: ${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setAllHistory(data);
    } catch (err) {
      console.error("Failed to fetch history Network Error:", err);
      alert("Note: History fetch network error. Check if server is on 5006.");
    }
  }, [logout]);

  const handleUpdateHistory = React.useCallback(async (topicName, updates) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const url = activeHistoryItem ? `http://localhost:5006/api/history/${activeHistoryItem._id}` : "http://localhost:5006/api/history";
      const method = activeHistoryItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: topicName, ...updates }),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setAllHistory(prev => prev.map(h => h._id === updatedItem._id ? updatedItem : h));
      }
    } catch (err) {
      console.error("Failed to update history:", err);
    }
  }, [activeHistoryItem]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setView("landing");
      setTopic("");
      setActiveHistoryItem(null);
    }
  }, [isAuthenticated, fetchHistory]);

  if (loading) return <div className="loading-screen">Loading...</div>;

  // Unauthenticated: Show Login/Register Flip Card
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Authenticated: Show Main Layout
  const handleStartTopic = (newTopic, historyItem = null, topicState = null) => {
    // Only load from cache if the history item was explicitly passed (e.g., clicked from the Sidebar history list).
    // If it came from a Search submission, we force a completely fresh API generation.
    const existing = historyItem;

    setTopic(newTopic);
    setView("topic");
    setActiveHistoryItem(existing);
    setInitialTopicState(topicState);

    // We no longer delete the old DB record because the user requested that multiple 
    // searches for the same topic label generate fresh, separate history records.
    if (!existing) {
      saveToHistory(newTopic);
    }

    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const saveToHistory = async (topicName) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5006/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: topicName }),
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (res.ok) {
        const newItem = await res.json();
        setAllHistory(prev => {
          return [newItem, ...prev];
        });
        setActiveHistoryItem(newItem);
      } else {
        console.error(`Save History Failed: ${res.status}`);
        const errData = await res.json().catch(() => ({}));
        console.error("Error data:", errData);
      }
    } catch (err) {
      console.error("Failed to save history Network Error:", err);
      alert("Note: Save search network error.");
    }
  };

  const handleNewChat = () => {
    setView("landing");
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`app-layout ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSelectTopic={(t) => handleStartTopic(t)}
        onSelectHistoryItem={(item) => handleStartTopic(item.topic, item)}
        onNewChat={handleNewChat}
        history={allHistory}
        setHistory={setAllHistory}
        onOpenLibrary={() => {
          setView("library");
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
      />

      <main className="app-main">
        <Header
          topic={topic}
          onSearch={handleStartTopic}
          onHome={handleNewChat}
          onOpenLibrary={() => setView("library")}
          onOpenExplore={() => setView("explore")}
          onOpenWorkspace={() => { if (topic) setView("topic"); }}
          onOpenSettings={() => setView("settings")}
          view={view}
          user={user}
          logout={logout}
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(true)}
        />
        {view === "landing" && (
          <LandingPage
            onStartTopic={handleStartTopic}
            onOpenExplore={() => setView("explore")}
            history={allHistory}
          />
        )}
        <div style={{ display: view === "topic" ? "block" : "none", flex: 1, minHeight: 0, width: "100%" }}>
          {topic && activeHistoryItem && (
            <TopicPage
              key={activeHistoryItem._id}
              topic={topic}
              onBack={handleNewChat}
              historyItem={activeHistoryItem}
              onUpdateHistory={(updates) => handleUpdateHistory(topic, updates)}
              initialState={initialTopicState}
            />
          )}
        </div>
        {view === "library" && <LibraryPage />}
        {view === "explore" && <ExplorePage onStartTopic={handleStartTopic} />}
        {view === "settings" && <SettingsPage onBack={handleNewChat} user={user} />}
      </main>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
