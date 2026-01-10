import React, { useState, useEffect, useRef } from "react";
import "./TopicPage.css";
import { useAuth } from "../context/AuthContext.js";

import { fetchTopicSummary } from "../services/summaryApi.js";
import { fetchTopicNotes, fetchChatResponse, fetchFlashcards, fetchFlashcardsFromChat } from "../services/notesApi.js";
import { fetchYoutubeVideos } from "../services/youtubeApi.js";
import { fetchReferenceBooks } from "../services/referenceBooksApi.js";
import { fetchSources } from "../services/sourcesApi.js";
import ReactMarkdown from "react-markdown";

import FlashcardDeck from "../components/FlashcardDeck.js";
import "../pages/Flashcards.css";

const PANELS = ["AI Notes", "Sources", "YouTube Videos", "Reference Books", "Flashcards"];
const API_URL = "http://localhost:5006/api/library";



function TopicPage({ topic, onBack }) {
  const { token } = useAuth();
  const [activePanel, setActivePanel] = useState(null);
  const scrollerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // --- SAVE HELPERS ---
  const handleSave = async (type, title, data) => {
    if (!token) return alert("Please login to save items.");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type, title, data, category: topic })
      });
      if (res.ok) {
        alert("Saved to Library!");
      } else {
        alert("Failed to save.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving item.");
    }
  };


  const handleScroll = () => {
    if (!scrollerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Sources
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState("");

  // Quick overview (right card)
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // YouTube
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // AI Notes
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");

  // Dynamic Suggestions State
  const [noteSuggestions, setNoteSuggestions] = useState([
    `Want more depth on basics of ${topic}?`,
    `Compare ${topic} with a related concept`,
    `Show advanced use cases of ${topic}`,
  ]);

  // Flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  // Reference books
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // --- EFFECTS ---

  useEffect(() => {
    if (activePanel !== "Reference Books") return;
    let cancelled = false;
    async function loadBooks() {
      setBooksLoading(true); setBooksError("");
      try {
        const list = await fetchReferenceBooks(topic);
        if (!cancelled) setBooks(list);
      } catch (err) { if (!cancelled) setBooksError("Could not load reference books."); }
      finally { if (!cancelled) setBooksLoading(false); }
    }
    loadBooks();
    return () => { cancelled = true; };
  }, [activePanel, topic]);

  useEffect(() => {
    if (activePanel !== "Sources") return;
    let cancelled = false;
    async function loadSources() {
      setSourcesLoading(true); setSourcesError("");
      try {
        const list = await fetchSources(topic);
        if (!cancelled) setSources(list);
      } catch (err) { if (!cancelled) setSourcesError("Could not load sources."); }
      finally { if (!cancelled) setSourcesLoading(false); }
    }
    loadSources();
    return () => { cancelled = true; };
  }, [activePanel, topic]);

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      setNotesLoading(true); setNotesError("");
      try {
        // Response is now { content, suggestions }
        const result = await fetchTopicNotes(topic);
        if (!cancelled) {
          if (typeof result === 'object' && result.content) {
            setNotes(result.content);
            if (result.suggestions && result.suggestions.length > 0) {
              setNoteSuggestions(result.suggestions);
            }
            // Generate flashcards from the notes context
            generateFlashcards(topic, result.content);
          } else {
            // Fallback for string response (pure legacy safety)
            setNotes(result);
            // Fallback: generate flashcards from the text content if possible
            generateFlashcards(topic, result);
          }
        }
      } catch (err) { if (!cancelled) setNotesError("Could not load AI notes."); }
      finally { if (!cancelled) setNotesLoading(false); }
    }
    loadNotes();
    return () => { cancelled = true; };
  }, [topic]);

  // Helper to generate flashcards from context
  async function generateFlashcards(topicName, contextText) {
    setFlashcardsLoading(true);
    setFlashcards([]);
    try {
      const cards = await fetchFlashcards(topicName, contextText);
      setFlashcards(cards);
    } catch (err) {
      console.error("Could not load flashcards");
    } finally {
      setFlashcardsLoading(false);
    }
  }



  // Chat
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const handleSuggestionClick = async (suggestion) => {
    const userMsg = { role: "user", content: suggestion };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setIsChatting(true);
    const response = await fetchChatResponse(newHistory);
    setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsChatting(false);

    // Adaptive Flashcards: Generate new cards based on the chat response
    fetchFlashcardsFromChat(response).then(newCards => {
      if (newCards.length > 0) {
        setFlashcards(prev => [...prev, ...newCards]);
        setToastMsg(`Added ${newCards.length} new flashcards!`);
      }
    });
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setIsChatting(true);
    const response = await fetchChatResponse(newHistory);
    setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsChatting(false);

    // Adaptive Flashcards (Manual Input)
    fetchFlashcardsFromChat(response).then(newCards => {
      if (newCards.length > 0) {
        setFlashcards(prev => [...prev, ...newCards]);
        setToastMsg(`Added ${newCards.length} new flashcards!`);
      }
    });
  };

  const handleTileClick = (name) => {
    setActivePanel((prev) => (prev === name ? null : name));
    if (name !== "YouTube Videos") setSelectedVideoId(null);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSummaryLoading(true); setSummaryError("");
      try {
        const text = await fetchTopicSummary(topic);
        if (!cancelled) setSummary(text);
      } catch (err) { if (!cancelled) setSummaryError("Could not load overview."); }
      finally { if (!cancelled) setSummaryLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [topic]);

  useEffect(() => {
    if (activePanel !== "YouTube Videos") return;
    let cancelled = false;
    async function loadVideos() {
      setVideosLoading(true); setVideosError("");
      try {
        const list = await fetchYoutubeVideos(topic);
        if (!cancelled) setVideos(list);
      } catch (err) { if (!cancelled) setVideosError("Could not load videos."); }
      finally { if (!cancelled) setVideosLoading(false); }
    }
    loadVideos();
    return () => { cancelled = true; };
  }, [activePanel, topic]);

  const summaryContent = summaryLoading ? "Loading..." : summaryError ? summaryError : summary || `No overview available.`;

  const handleSidebarClick = (name) => {
    setActivePanel(name);
    if (name !== "YouTube Videos") setSelectedVideoId(null);
  };
  const remainingPanels = activePanel ? PANELS.filter((p) => p !== activePanel && p !== activePanel) : []; // Filter logic handled in render

  let focusBody;
  // REUSE AI NOTES Logic for Flashcards mode to keep Notes visible
  if (activePanel === "AI Notes" || activePanel === "Flashcards") {
    focusBody = (
      <div className="tp-notes-block">
        {notesLoading && <div className="tp-loading">Generating AI Notes...</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="tp-notes-heading">{topic} – AI generated notes</h3>
          <button
            className="tp-save-btn"
            onClick={() => handleSave("note", `AI Notes used for ${topic}`, { content: notes })}
          >
            ★ Save Notes
          </button>
        </div>
        <div className="tp-notes-interface">
          <div className="tp-notes-scroller" ref={scrollerRef} onScroll={handleScroll}>
            <div className="tp-notes-markdown">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
            {chatMessages.length > 0 && (
              <div className="tp-chat-history">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`tp-chat-msg tp-chat-msg--${msg.role}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ))}
              </div>
            )}
            {noteSuggestions.length > 0 && (
              <div className="tp-notes-suggestions">
                <span className="tp-notes-suggestions-label">Explore more:</span>
                {noteSuggestions.map((s) => (
                  <button key={s} className="tp-notes-suggestion-chip" onClick={() => handleSuggestionClick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {showScrollBtn && <button className="tp-scroll-btn" onClick={scrollToBottom}>↓</button>}
          <div className="tp-chat-sticky-footer">
            <form className="tp-chat-form" onSubmit={handleChatSubmit}>
              <input type="text" className="tp-chat-input" placeholder="Ask a follow-up..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isChatting} />
              <button type="submit" className="tp-chat-send" disabled={isChatting}>{isChatting ? "..." : "Send"}</button>
            </form>
          </div>
        </div>
      </div>
    );
  } else if (activePanel === "YouTube Videos") {
    if (videos.length > 0) {
      const current = selectedVideoId && videos.find((v) => v.id === selectedVideoId);
      const activeVideo = current || videos[0];
      focusBody = (
        <div className="tp-video-layout">
          <div className="tp-video-player-wrap">
            <iframe src={`https://www.youtube.com/embed/${activeVideo.id}`} title={activeVideo.title} frameBorder="0" allowFullScreen />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <div>
              <h3 className="tp-video-focus-title">{activeVideo.title}</h3>
              <p className="tp-video-focus-channel">{activeVideo.channel}</p>
            </div>
            <button
              className="tp-save-btn"
              onClick={() => handleSave("video", activeVideo.title, { url: `https://www.youtube.com/watch?v=${activeVideo.id}`, thumbnail: activeVideo.thumbnail })}
            >
              ★ Save
            </button>
          </div>
          <div className="tp-videos-grid">
            {videos.map((v) => (
              <button key={v.id} className={`tp-video-card ${activeVideo.id === v.id ? "tp-video-card--active" : ""}`} onClick={() => setSelectedVideoId(v.id)}>
                <img src={v.thumbnail} alt={v.title} />
                <div className="tp-video-card-body">
                  <div className="tp-video-title">{v.title}</div>
                  <div className="tp-video-channel">{v.channel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      focusBody = <p>No videos found.</p>;
    }
  } else if (activePanel === "Reference Books") {
    focusBody = (
      <div className="tp-books-list">
        <h3 className="tp-notes-heading">{topic} – reference books</h3>
        <ul className="tp-books-ul">
          {books.map((b) => (
            <li key={b.title} className="tp-book-item">
              <div className="tp-book-card-inner">
                <div className="tp-book-info">
                  <div className="tp-book-title">{b.title}</div>
                  <div className="tp-book-author">{b.author}</div>
                  <div className="tp-book-source">Source: {b.source === "curated" ? "Curated" : "Google Books"}</div>
                  <div className="tp-book-actions">
                    <a href={b.link} target="_blank" rel="noreferrer" className="tp-book-view-btn">View book</a>
                    <button className="tp-save-btn-small" onClick={() => handleSave("book", b.title, { url: b.link, thumbnail: b.thumbnail })}>★</button>
                  </div>
                </div>
                <div className="tp-book-cover-wrap">
                  {b.thumbnail ? <img src={b.thumbnail} alt={b.title} className="tp-book-cover" /> : <div className="tp-book-cover-placeholder"></div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (activePanel === "Sources") {
    // existing sources logic simplifed for brevity in this rewrite, assuming logic handled by map
    const list = sources;
    focusBody = (
      <div className="tp-sources-block">
        <h3 className="tp-notes-heading">Best web sources for {topic}</h3>
        <ul className="tp-sources-list">
          {list.map((s) => (
            <li key={s.url} className="tp-source-card">
              <div className="tp-source-row">
                <a href={s.url} target="_blank" rel="noreferrer" className="tp-source-main">
                  <div className="tp-source-title">{s.title}</div>
                  {s.snippet && <div className="tp-source-snippet">{s.snippet}</div>}
                </a>
                <button className="tp-save-btn-small" onClick={() => handleSave("source", s.title, { url: s.url, snippet: s.snippet })}>★</button>
              </div>
              {s.domain && <div className="tp-source-domain">{s.domain}</div>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Determine Sidebar Content
  let sidebarContent;
  if (activePanel === "Flashcards") {
    sidebarContent = (
      <div className="tp-flashcards-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 className="tp-sidebar-title">Flashcards</h2>
          <button className="tp-focus-close" onClick={() => handleSidebarClick('AI Notes')} style={{ fontSize: '12px', padding: '4px 8px' }}>
            Hide
          </button>
        </div>
        {flashcardsLoading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '50px' }}>Generating Flashcards...</div>
        ) : (
          <FlashcardDeck cards={flashcards} />
        )}
      </div>
    );
  } else {
    // Standard Navigation
    sidebarContent = (
      <>
        <div className="tp-sidebar-tile tp-sidebar-summary">
          <h2 className="tp-sidebar-title">Quick overview</h2>
          <p className="tp-sidebar-sub" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.5' }}>
            {summaryContent}
          </p>
        </div>
        {PANELS.filter(p => p !== activePanel).map((name) => (
          <button key={name} className="tp-sidebar-tile" onClick={() => handleSidebarClick(name)}>
            <span className="tp-sidebar-title">{name}</span>
            <span className="tp-sidebar-sub">Switch to {name.toLowerCase()}</span>
          </button>
        ))}
      </>
    );
  }

  return (
    <div className="tp-root">
      <div className="lp-bg-orb lp-bg-orb--left" />
      <div className="lp-bg-orb lp-bg-orb--right" />
      <main className={`tp-shell ${activePanel ? "tp-mode-focus" : ""} ${activePanel === 'Flashcards' ? "tp-mode-flashcards" : ""}`}>
        <header className="tp-header">
          <button className="tp-back-btn" onClick={onBack} title="Back to Home">
            ←
          </button>
          <h1 className="tp-title">{topic}</h1>
          <p className="tp-subtitle">Curated resources for this topic.</p>
        </header>

        {activePanel === null ? (
          <>
            <article className="tp-tile tp-summary-tile">
              <h2 className="tp-summary-title">Quick overview</h2>
              <p className="tp-summary-text">{summaryContent}</p>
            </article>
            <section className="tp-grid">
              {PANELS.map((name) => (
                <article key={name} className="tp-tile" onClick={() => handleTileClick(name)}>
                  <h2>{name}</h2>
                  <p>Open {name.toLowerCase()} for “{topic}”.</p>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="tp-focus-layout">
            <article className="tp-focus-main">
              <div className="tp-focus-header">
                <span className="tp-focus-label">Focused view</span>
                <button className="tp-focus-close" onClick={() => setActivePanel(null)}>Back to all tiles</button>
              </div>
              <h2 className="tp-focus-title">{activePanel === 'Flashcards' ? 'AI Notes' : activePanel}</h2>
              {focusBody}
            </article>
            <aside className="tp-focus-sidebar">
              {sidebarContent}
            </aside>
          </section>
        )}
      </main>
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(100, 255, 218, 0.9)',
          color: '#000',
          padding: '10px 20px',
          borderRadius: '20px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 0 15px rgba(100, 255, 218, 0.5)'
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default TopicPage;
