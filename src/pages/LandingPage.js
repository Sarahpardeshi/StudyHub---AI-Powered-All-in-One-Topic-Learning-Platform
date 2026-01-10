import React from "react";
import "./LandingPage.css";
import SearchBar from "../components/SearchBar.js";
import SuggestedTopics from "../components/SuggestedTopics.js";

function LandingPage({ onStartTopic }) {
  const handleSearch = (topic) => {
    onStartTopic(topic);
    console.log("Search topic:", topic);
  };


  return (
    <div className="lp-root">
      <div className="lp-bg-orb lp-bg-orb--left" />
      <div className="lp-bg-orb lp-bg-orb--right" />

      <main className="lp-shell">
        <header className="lp-header">
          <div className="lp-logo-wrap">
            <div className="lp-logo-icon">✦</div>
          </div>
          <h1 className="lp-title">Welcome to Notes Hub</h1>
          <p className="lp-subtitle">
            Your AI‑powered study companion for any topic.
          </p>
        </header>

        <section className="lp-search-section">
          <SearchBar onSearch={handleSearch} />
          <div className="lp-actions">
            <button className="lp-action-btn">
              <span>📤</span>
              Upload Files
            </button>
            <button className="lp-action-btn">
              <span>☁️</span>
              Add from Drive
            </button>
            <button className="lp-action-btn lp-action-btn--ghost">
              ⋯ More Options
            </button>
          </div>
        </section>

        <section className="lp-suggested-section">
          <div className="lp-suggested-header">
            <span className="lp-suggested-label">Suggested topics</span>
          </div>
          <SuggestedTopics onSelectTopic={handleSearch} />
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
