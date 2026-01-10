import React, { useState } from "react";
import "./App.css";
import LandingPage from "./pages/LandingPage.js";
import TopicPage from "./pages/TopicPage.js";
import AuthPage from "./pages/AuthPage.js";
import LibraryPage from "./pages/LibraryPage.js";
import Sidebar from "./components/Sidebar.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext.js";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Wrapper to handle conditional rendering based on auth
function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  // Auth state now handled internally by AuthPage

  // App views
  const [view, setView] = useState("landing"); // "landing" | "topic" | "library"
  const [topic, setTopic] = useState("");
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) return <div className="loading-screen">Loading...</div>;

  // Unauthenticated: Show Login/Register Flip Card
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Authenticated: Show Main Layout
  const handleStartTopic = (newTopic) => {
    setTopic(newTopic);
    setView("topic");
    // Also save to history API
    saveToHistory(newTopic);
  };

  const saveToHistory = async (topicName) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      await fetch("http://localhost:5006/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: topicName }),
      });
    } catch (err) {
      console.error("Failed to save history", err);
    }
  };

  const handleNewChat = () => {
    setView("landing");
    setTopic("");
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSelectTopic={handleStartTopic}
        onNewChat={handleNewChat}
        onOpenLibrary={() => setView("library")}
      />

      {!sidebarOpen && (
        <button className="sidebar-open-btn" onClick={() => setSidebarOpen(true)} title="Open Sidebar">
          ➤
        </button>
      )}

      <main className="app-main">
        {view === "landing" && <LandingPage onStartTopic={handleStartTopic} />}
        {view === "topic" && (
          <TopicPage
            topic={topic}
            onBack={handleNewChat}
          />
        )}
        {view === "library" && <LibraryPage />}
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
