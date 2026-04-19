import React, { useState, useEffect, useRef } from "react";
import "./TopicPage.css";
import { useAuth } from "../context/AuthContext.js";

import { fetchTopicSummary } from "../services/summaryApi.js";
import { fetchTopicNotes, fetchChatResponse, fetchFlashcards, fetchFlashcardsFromChat, fetchQuizQuestions, fetchReadingList, fetchWebSources, fetchVideoInsights } from "../services/notesApi.js";
import { fetchYoutubeVideos } from "../services/youtubeApi.js";
import ReactMarkdown from "react-markdown";
import {
  LayoutDashboard,
  Lightbulb,
  PenTool,
  Layers,
  Youtube,
  BookOpen,
  Globe,
  ExternalLink,
  Star,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
  Share2,
  FileText,
  Layout,
  RefreshCw
} from "lucide-react";

import FlashcardDeck from "../components/FlashcardDeck.js";
import Quiz from "../components/Quiz.js";
import "../pages/Flashcards.css";

const PANELS = [
  { id: "AI Notes", name: "Key Concepts", icon: <Lightbulb size={18} /> },
  { id: "Quizzes", name: "Training Quiz", icon: <PenTool size={18} /> },
  { id: "Flashcards", name: "Smart Cards", icon: <Layers size={18} /> },
  { id: "YouTube Videos", name: "Video Lessons", icon: <Youtube size={18} /> },
  { id: "Reading List", name: "Reading List", icon: <BookOpen size={18} /> },
  { id: "Web Sources", name: "Web Sources", icon: <Globe size={18} /> }
];

const API_URL = "http://localhost:5006/api/library";

const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!inline && match) {
    return (
      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px' }}>
        <button 
           onClick={handleCopy} 
           style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', zIndex: 10, backdropFilter: 'blur(4px)' }}
           title="Copy to clipboard"
        >
          {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
        </button>
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    );
  }
  return <code className={className} {...props}>{children}</code>;
};

const BookCover = ({ book }) => {
  const [imgSrc, setImgSrc] = useState(
    book.thumbnail ? book.thumbnail.replace("http://", "https://") : null
  );

  useEffect(() => {
    let active = true;
    if (!book.thumbnail) {
      const query = `intitle:${encodeURIComponent(book.title)}${book.author ? `+inauthor:${encodeURIComponent(book.author)}` : ''}`;
      fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`)
        .then(res => res.json())
        .then(data => {
          if (active) {
            const item = data.items?.[0]?.volumeInfo;
            const img = item?.imageLinks?.thumbnail || item?.imageLinks?.smallThumbnail;
            if (img) {
              setImgSrc(img.replace("http://", "https://"));
            } else {
              setImgSrc("https://placehold.co/128x192/E2E8F0/64748B?text=No+Cover");
            }
          }
        })
        .catch(() => {
          if (active) setImgSrc("https://placehold.co/128x192/E2E8F0/64748B?text=No+Cover");
        });
    }
    return () => { active = false; };
  }, [book.thumbnail, book.title, book.author]);

  return (
    <img
      src={imgSrc || `https://placehold.co/128x192/E2E8F0/64748B?text=Loading...`}
      alt={book.title}
      onError={(e) => { e.target.src = "https://placehold.co/128x192/E2E8F0/64748B?text=No+Cover"; }}
    />
  );
};

function TopicPage({ topic, onBack, historyItem, onUpdateHistory, initialState }) {
  const { token, logout } = useAuth();
  const [activePanel, setActivePanel] = useState(initialState?.initialPanel || "AI Notes");
  const scrollerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // State for different data types
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState(null);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [quizzes, setQuizzes] = useState(null);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [visibleVideosCount, setVisibleVideosCount] = useState(6);
  const [videoError, setVideoError] = useState(null);
  const [readingList, setReadingList] = useState(null);
  const [readingListLoading, setReadingListLoading] = useState(false);
  const [webSources, setWebSources] = useState(null);
  const [webSourcesLoading, setWebSourcesLoading] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [selectedVideo, setSelectedVideo] = useState(initialState?.initialVideo || null);

  // Sync with initialState if it changes (e.g. clicking a new video while on TopicPage)
  useEffect(() => {
    if (initialState) {
      if (initialState.initialPanel) setActivePanel(initialState.initialPanel);
      if (initialState.initialVideo) setSelectedVideo(initialState.initialVideo);
    }
  }, [initialState]);

  // Load Initial Data
  useEffect(() => {
    async function loadInitial() {
      // If we have historyItem with data, use it!
      if (historyItem && historyItem.content) {
        setNotes(historyItem.content);
        setChatMessages(historyItem.chatMessages || []);
        if (historyItem.flashcards && historyItem.flashcards.length > 0) setFlashcards(historyItem.flashcards);
        if (historyItem.quizzes && historyItem.quizzes.length > 0) setQuizzes(historyItem.quizzes);

        // Background load summary if missing
        fetchTopicSummary(topic)
          .then(res => setSummary(res || "No overview available for this topic."))
          .catch(() => setSummary("No overview available for this topic."));
        return;
      }

      // Otherwise, reset and load fresh
      setNotes("");
      setSummary("");
      setFlashcards(null);
      setQuizzes(null);
      setVideos([]);
      setVisibleVideosCount(6);
      setReadingList([]);
      setChatMessages([]);

      setNotesLoading(true);
      try {
        const result = await fetchTopicNotes(topic);
        const content = typeof result === 'object' ? result.content : result;
        setNotes(content);
        fetchTopicSummary(topic)
          .then(res => setSummary(res || "No overview available for this topic."))
          .catch(() => setSummary("No overview available for this topic."));
        fetchFlashcards(topic, content).then(setFlashcards);

        // Initial save to history
        onUpdateHistory({ content });
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setNotesLoading(false);
      }
    }
    loadInitial();
  }, [topic, historyItem?._id]); // Only re-run if topic or specific history record changes

  // Auto-save changes to history
  useEffect(() => {
    if (notes && onUpdateHistory) {
      const timeout = setTimeout(() => {
        onUpdateHistory({
          content: notes,
          chatMessages,
          flashcards: Array.isArray(flashcards) ? flashcards : [],
          quizzes: Array.isArray(quizzes) ? quizzes : []
        });
      }, 2000); // Debounce save
      return () => clearTimeout(timeout);
    }
  }, [notes, chatMessages, flashcards, quizzes]);

  // Load Panel Data on demand (YouTube, Reading List, etc.)
  useEffect(() => {
    if (activePanel === "YouTube Videos" && videos.length === 0 && !videoError) {
      fetchYoutubeVideos(topic)
        .then(setVideos)
        .catch(err => {
          console.error("Video load error:", err);
          setVideoError(err.message || "Unable to load videos.");
        });
    } else if (activePanel === "Flashcards" && flashcards === null && notes && !flashcardsLoading) {
      setFlashcardsLoading(true);
      fetchFlashcards(topic, notes).then(data => {
        setFlashcards(data);
        setFlashcardsLoading(false);
      }).catch(() => {
        setFlashcards([]);
        setFlashcardsLoading(false);
      });
    } else if (activePanel === "Quizzes" && quizzes === null && notes && !quizzesLoading) {
      setQuizzesLoading(true);
      fetchQuizQuestions(topic, notes).then(data => {
        setQuizzes(data);
        setQuizzesLoading(false);
      }).catch(() => {
        setQuizzes([]);
        setQuizzesLoading(false);
      });
    } else if (activePanel === "Reading List" && readingList === null && !readingListLoading) {
      setReadingListLoading(true);
      fetchReadingList(topic).then(data => {
        setReadingList(data || []);
        setReadingListLoading(false);
      }).catch(() => {
        setReadingList([]);
        setReadingListLoading(false);
      });
    } else if (activePanel === "Web Sources" && webSources === null && !webSourcesLoading) {
      setWebSourcesLoading(true);
      fetchWebSources(topic).then(data => {
        setWebSources(data || []);
        setWebSourcesLoading(false);
      }).catch(() => {
        setWebSources([]);
        setWebSourcesLoading(false);
      });
    }
  }, [activePanel, topic, notes, videos.length, readingList, webSources, flashcards, quizzes, flashcardsLoading, quizzesLoading, readingListLoading, webSourcesLoading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatting]);

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments(prev => [...prev, { file, type: "image", preview: ev.target.result }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setAttachments(prev => [...prev, { file, type: "pdf", preview: "📄" }]);
      } else {
        // Plain text
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments(prev => [...prev, { file, type: "text", text: ev.target.result, preview: "📝" }]);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = null; // reset
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && attachments.length === 0) || isChatting) return;

    let textContent = chatInput;
    let hasImages = false;
    let multimodalContent = [];

    // Add text from attachments
    for (const att of attachments) {
      if (att.type === "text") {
        // Truncate to avoid Groq Context Length exceeded errors on massive 10k+ row datasets
        const safeText = att.text.length > 50000 ? att.text.substring(0, 50000) + "\n\n...[DATASET TRUNCATED DUE TO SIZE LIMITS]" : att.text;
        textContent += `\n\n--- Document: ${att.file.name} ---\n${safeText}`;
      } else if (att.type === "pdf") {
        try {
          const formData = new FormData();
          formData.append("file", att.file);
          const res = await fetch("http://localhost:5006/api/extract-pdf", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            const safePdfText = data.text.length > 50000 ? data.text.substring(0, 50000) + "\n\n...[PDF TRUNCATED DUE TO SIZE LIMITS]" : data.text;
            textContent += `\n\n--- Document (PDF): ${att.file.name} ---\n${safePdfText}`;
          }
        } catch (err) {
          console.error("PDF extract error", err);
        }
      } else if (att.type === "image") {
        hasImages = true;
        multimodalContent.push({
          type: "image_url",
          image_url: { url: att.preview }
        });
      }
    }

    const hasDocument = attachments.some(a => a.type === "text" || a.type === "pdf");

    let userContent = textContent;
    if (hasImages) {
      multimodalContent.unshift({ type: "text", text: textContent || "What is in this image?" });
      userContent = multimodalContent;
    }

    let displayContent = chatInput || "";
    if (attachments.length > 0) {
      if (displayContent) displayContent += `\n\n`;
      displayContent += `*(Attached ${attachments.length} file(s))*`;
    }

    // 1. Create the UI-only message for the React state (hiding the huge dataset)
    // Both 'content' and 'displayContent' in the React state should just be the visual string
    const uiMessage = { role: "user", content: displayContent, displayContent: displayContent, _hiddenPayload: userContent };
    
    // We append the visual-only representation into our React state so the chat history doesn't choke.
    const newHistory = [...chatMessages, uiMessage];
    setChatMessages(newHistory);
    setChatInput("");
    setAttachments([]);
    setIsChatting(true);

    if (onUpdateHistory && notes) {
      onUpdateHistory({
        content: notes,
        chatMessages: newHistory,
        flashcards: Array.isArray(flashcards) ? flashcards : [],
        quizzes: Array.isArray(quizzes) ? quizzes : []
      });
    }

    try {
      // 2. Create the ACTUAL payload for the API (includes the dataset)
      const apiHistoryForThisRequest = chatMessages.map(m => ({ 
        role: m.role, 
        // Use the hidden payload if it exists (for past file uploads), otherwise use regular content
        content: m._hiddenPayload || m.content 
      }));
      apiHistoryForThisRequest.push({ role: "user", content: userContent });
      
      const response = await fetchChatResponse(apiHistoryForThisRequest, topic, notes, hasDocument);
      const updatedHistory = [...newHistory, { role: "assistant", content: response, displayContent: response }];
      setChatMessages(updatedHistory);
      
      if (onUpdateHistory && notes) {
        onUpdateHistory({
          content: notes,
          chatMessages: updatedHistory,
          flashcards: Array.isArray(flashcards) ? flashcards : [],
          quizzes: Array.isArray(quizzes) ? quizzes : []
        });
      }

      // PERSIST TO SMART NOTES: Append meaningful findings to the study guide
      // Note: Removed the text appending to 'notes' to prevent duplicating the answer 
      // above the user's chat question. The chat response will stay in the chat UI.
      if (typeof response === "string" && response.length > 50) {

        // Auto-generate more flashcards from this new information
        fetchFlashcards(topic, response).then(moreCards => {
          if (moreCards && moreCards.length > 0) {
            setFlashcards(prev => {
              if (Array.isArray(prev)) {
                const existingQuestions = new Set(prev.map(c => (c.question || "").toLowerCase().trim()));
                const filteredNew = moreCards.filter(c => c && c.question && !existingQuestions.has(c.question.toLowerCase().trim()));
                return [...prev, ...filteredNew];
              }
              return moreCards;
            });
          }
        });

        // Auto-generate more quiz questions from this specific new sub-topic context
        fetchQuizQuestions(topic, response).then(moreQuizzes => {
          if (moreQuizzes && moreQuizzes.length > 0) {
            setQuizzes(prev => {
              if (Array.isArray(prev)) {
                const existingQs = new Set(prev.map(q => (q.question || "").toLowerCase().trim()));
                const filteredNew = moreQuizzes.filter(q => q && q.question && !existingQs.has(q.question.toLowerCase().trim()));
                return [...prev, ...filteredNew];
              }
              return moreQuizzes;
            });
          }
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatting(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMessage("Speech recognition not supported in this browser.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSaveToLibrary = async (title, data, type = "quiz") => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5006/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title,
          data,
          category: topic // Use topic as category
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }
      
      setToastMessage("Saved to Library!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setToastMessage("Failed to save to library.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const retryFetch = (panelId) => {
    if (panelId === "Reading List") {
      setReadingList(null);
    } else if (panelId === "Web Sources") {
      setWebSources(null);
    } else if (panelId === "Flashcards") {
      setFlashcards(null);
    } else if (panelId === "YouTube Videos") {
      setVideos([]);
      setVideoError(null);
    } else if (panelId === "Quizzes") {
      setQuizzes(null);
    }
  };

  const renderContent = () => {
    if (notesLoading && activePanel === "AI Notes") {
      return (
        <div className="tp-loading-state">
          <div className="tp-spinner"></div>
          <p>Synthesizing your deep study guide...</p>
        </div>
      );
    }

    switch (activePanel) {
      case "AI Notes":
        return (
          <div className="tp-markdown">
            <ReactMarkdown components={{ code: CodeBlock }}>{notes}</ReactMarkdown>
            <div className="tp-chat-history" ref={chatContainerRef}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`tp-chat-bubble-wrapper tp-chat-bubble--${msg.role}`}>
                  <div className="tp-chat-bubble">
                    <ReactMarkdown components={{ code: CodeBlock }}>{msg.displayContent || (typeof msg.content === 'string' ? msg.content : "*(Document/Image Attached)*")}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="tp-chat-bubble-wrapper tp-chat-bubble--assistant">
                  <div className="tp-chat-bubble loading">
                    <div className="tp-typing-dots"><span></span><span></span><span></span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "Flashcards":
        if (flashcardsLoading || (notesLoading && flashcards === null)) {
          return (
            <div className="tp-loading-state">
              <div className="tp-spinner"></div>
              <p>Crafting your focused smart cards...</p>
            </div>
          );
        }
        return <FlashcardDeck cards={flashcards} onRegenerate={() => retryFetch("Flashcards")} />;
      case "Quizzes":
        if (quizzesLoading || (notesLoading && quizzes === null)) {
          return (
            <div className="tp-loading-state">
              <div className="tp-spinner"></div>
              <p>Generating your training quiz...</p>
            </div>
          );
        }
        return (
          <Quiz
            questions={quizzes}
            topic={topic}
            onRestart={() => retryFetch("Quizzes")}
            onSave={handleSaveToLibrary}
          />
        );
      case "YouTube Videos":
        if (videoError) {
          return (
            <div className="tp-empty-state">
              <p>🎥 {videoError}</p>
              <button 
                className="tp-retry-btn" 
                onClick={() => retryFetch("YouTube Videos")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={16} /> Retry Discovery
              </button>
            </div>
          );
        }
        return (
          <div className="tp-videos-container" style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
            <div className="tp-videos-grid">
              {videos.length > 0 ? (
                videos.slice(0, visibleVideosCount).map((v, idx) => (
                  <div key={v.id} className="tp-video-card" style={{animationDelay: `${idx * 0.1}s`}}>
                    <div className="tp-video-thumb" onClick={() => setSelectedVideo(v)}>
                      <img src={v.thumbnail} alt={v.title} loading="lazy" />
                      <div className="tp-video-play-hint">
                         <Youtube size={32} fill="white" />
                      </div>
                      <button
                        className="tp-item-save-btn"
                        title="Save Video"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToLibrary(v.title, v, "video");
                        }}
                      >
                        <Star size={16} />
                      </button>
                    </div>
                    <div className="tp-video-info" onClick={() => setSelectedVideo(v)}>
                      <h3>{v.title}</h3>
                      <p>{v.channel}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="tp-skeleton-card">
                      <div className="tp-skeleton-thumb"></div>
                      <div className="tp-skeleton-info">
                        <div className="tp-skeleton-line"></div>
                        <div className="tp-skeleton-line short"></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {videos.length > visibleVideosCount && (
              <div className="tp-load-more-section" style={{display: 'flex', justifyContent: 'center', paddingBottom: '20px'}}>
                 <button 
                  className="tp-load-more-btn"
                  onClick={() => setVisibleVideosCount(prev => prev + 6)}
                  style={{
                    padding: '12px 30px',
                    borderRadius: '14px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                  }}
                 >
                   <Youtube size={18} /> LOAD MORE VIDEOS
                 </button>
              </div>
            )}
          </div>
        );
      case "Reading List":
        if (readingListLoading) {
          return (
            <div className="tp-loading-state">
              <div className="tp-spinner"></div>
              <p>Curating your personalized reading list...</p>
            </div>
          );
        }
        return (
          <div className="tp-books-grid">
            {readingList && readingList.length > 0 ? (
              readingList.map((b, index) => (
                <a
                  key={index}
                  href={b.directPdfUrl || `https://www.google.com/search?q=${encodeURIComponent(b.title + ' Doctype:pdf')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tp-book-card-link"
                >
                  <div className="tp-book-card">
                    <div className="tp-book-cover-wrapper" style={{position: 'relative', display: 'flex'}}>
                      <BookCover book={b} />
                      {b.directPdfUrl && <span className="tp-direct-pdf-badge" style={{position: 'absolute', top: 4, right: 4, background: '#10B981', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '800'}}>PDF</span>}
                    </div>
                    <div>
                      <h3>{b.title}</h3>
                      <p><strong>{b.author}</strong></p>
                      <p className="tp-book-desc">{b.description || b.snippet || ""}</p>
                    </div>
                    <button
                      className="tp-item-save-btn"
                      title="Save to Library"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveToLibrary(b.title, b, "book");
                      }}
                    >
                      <Star size={16} />
                    </button>
                  </div>
                </a>
              ))
            ) : readingList ? (
              <div className="tp-empty-state">
                <p>No recommendations found for this topic.</p>
                <button className="tp-retry-btn" onClick={() => retryFetch("Reading List")}>🔄 Try Again</button>
              </div>
            ) : null}
          </div>
        );
      case "Web Sources":
        if (webSourcesLoading) {
          return (
            <div className="tp-loading-state">
              <div className="tp-spinner"></div>
              <p>Scouring the web for authoritative sources...</p>
            </div>
          );
        }
        return (
          <div className="tp-sources-list">
            {webSources && webSources.length > 0 ? (
              webSources.map((s, idx) => (
                <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="tp-source-card">
                  <div className="tp-source-icon">
                    <Globe size={20} />
                  </div>
                  <div className="tp-source-info">
                    <h3>{s.name}</h3>
                    <p>{new URL(s.url).hostname}</p>
                  </div>
                  <button
                    className="tp-item-save-btn"
                    title="Save Source"
                    style={{ right: '48px' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveToLibrary(s.name, s, "source");
                    }}
                  >
                    <Star size={16} />
                  </button>
                  <div className="tp-source-action">
                    <ExternalLink size={16} />
                  </div>
                </a>
              ))
            ) : webSources ? (
              <div className="tp-empty-state">
                <p>No web sources found for this topic.</p>
                <button className="tp-retry-btn" onClick={() => retryFetch("Web Sources")}>🔄 Try Again</button>
              </div>
            ) : null}
          </div>
        );
      default:
        return <p>Select a section from the sidebar to begin.</p>;
    }
  };

  return (
    <div className="tp-root">
      <div className="tp-container">
        <aside className="tp-sidebar">
          <div className="tp-sidebar-header">
            <span className="tp-sidebar-label">Current Workspace</span>
            <span className="tp-sidebar-topic-name">{topic}</span>
          </div>

          <nav className="tp-nav">
            {PANELS.map(p => (
              <button
                key={p.id}
                className={`tp-nav-item ${activePanel === p.id ? 'active' : ''}`}
                onClick={() => setActivePanel(p.id)}
                title={p.name}
              >
                <span className="tp-nav-icon">{p.icon}</span>
                <span className="tp-nav-text">{p.name}</span>
              </button>
            ))}
          </nav>

          <div className="tp-sidebar-footer">
            <button className="tp-new-topic-btn" onClick={onBack} title="New Deep Study">
              <span className="tp-btn-icon"><Sparkles size={18} /></span>
              <span className="tp-btn-text">New Deep Study</span>
            </button>
          </div>
        </aside>

        <main className="tp-main" ref={scrollerRef}>
          <div className="tp-scroll-content" style={{ position: "relative", minHeight: "100%", width: "100%" }}>
            <div className="tp-sticky-save-container">
              {(activePanel === "AI Notes" || activePanel === "Summary") && (
                <button
                  className="tp-header-save-btn"
                  onClick={() => handleSaveToLibrary(`${topic} - ${activePanel}`, { content: activePanel === "AI Notes" ? notes : summary }, "note")}
                >
                  <Star size={16} fill="currentColor" /> Save {activePanel}
                </button>
              )}
            </div>
            <div className="tp-content-wrapper" style={{ position: "relative" }}>
              <div className="tp-content-header">
                <div className="tp-breadcrumb">Workspace <span>/</span> {topic} <span>/</span> {activePanel}</div>
                <h1 className="tp-title">{activePanel === "AI Notes" ? "Deep Study Guide" : activePanel}</h1>
              </div>

              <div className="tp-content-body">
                {renderContent()}
              </div>

            {(activePanel === "AI Notes" || activePanel === "Summary") && (
              <div className="tp-chat-section">
                {attachments.length > 0 && (
                  <div className="tp-attachments-preview" style={{display: 'flex', gap: '8px', padding: '8px', overflowX: 'auto', borderBottom: '1px solid #333'}}>
                    {attachments.map((att, i) => (
                      <div key={i} className="tp-attachment-chip" style={{display: 'flex', alignItems: 'center', background: '#252529', padding: '4px 8px', borderRadius: '8px', border: '1px solid #3f3f46'}}>
                        {att.type === "image" ? (
                          <img src={att.preview} alt="preview" style={{width: 24, height: 24, objectFit: "cover", borderRadius: 4}} />
                        ) : (
                          <span style={{fontSize: 16}}>{att.preview}</span>
                        )}
                        <span className="tp-attachment-name" style={{fontSize: 12, marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100, color: '#e4e4e7'}}>{att.file.name}</span>
                        <button onClick={() => removeAttachment(i)} style={{marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0 4px', fontSize: '16px'}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="tp-scroll-bottom-container">
                    <button className="tp-scroll-bottom-btn" onClick={scrollToBottom} title="Scroll to bottom">
                        ↓
                    </button>
                </div>

                <div className="tp-chat-bar" style={{borderTop: 'none'}}>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.txt,.csv,.md,.json,.js"
                  />
                  <input
                    type="text"
                    className="tp-chat-input"
                    placeholder="Ask your AI tutor anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit(e)}
                  />
                  <div className="tp-chat-icons">
                    <button className="tp-icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload Files">📎</button>
                    <button 
                      className={`tp-icon-btn ${isListening ? 'tp-mic-active' : ''}`} 
                      onClick={toggleListening}
                      title={isListening ? "Listening..." : "Voice Input"}
                    >
                      {isListening ? "🛑" : "🎙️"}
                    </button>
                    <button className="tp-send-btn" onClick={handleChatSubmit} disabled={isChatting}>
                      {isChatting ? "..." : "↑"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </main>
      </div>



      {toastMessage && (
        <div className="tp-toast">
          ✓ {toastMessage}
        </div>
      )}
      {selectedVideo && (
        <VideoAnalysisMode 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          topicNotes={notes}
          topicSummary={summary}
          onSave={handleSaveToLibrary}
        />
      )}
    </div>
  );
}
const VideoAnalysisMode = ({ video, onClose, topicNotes, topicSummary, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [streamedNotes, setStreamedNotes] = useState([]);
  const [allVideoInsights, setAllVideoInsights] = useState([]);
  const currentInsightsRef = useRef([]);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // NEW: Track playback
  const playerRef = useRef(null);
  const notesEndRef = useRef(null);
  const sidebarContentRef = useRef(null);
  const playerDivRef = useRef(null); // Direct DOM ref for stability
  const nextIndexRef = useRef(2); 

  // 0. Load YouTube IFrame API
  useEffect(() => {
    if (!video?.id) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) playerRef.current.destroy();
      
      console.log("[YT API] Creating player for:", video.id);
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: video.id,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
          enablejsapi: 1
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event) => {
            if (event.data === 1) setIsPlaying(true); // 1 = PLAYING
            else setIsPlaying(false);
          },
          onError: (e) => {
            console.error("[YT API] Player Error:", e.data);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
       if (playerRef.current && playerRef.current.destroy) {
         playerRef.current.destroy();
         playerRef.current = null;
       }
    };
  }, [video?.id]);

  // Sync ref with state
  useEffect(() => {
    currentInsightsRef.current = allVideoInsights;
  }, [allVideoInsights]);

  // 1. Fetch High-Accuracy Video Specific Insights
  useEffect(() => {
    if (!video) return;
    
    async function getSpecificInsights() {
      const insights = await fetchVideoInsights(topicNotes ? "Contextual Study" : "General Learning", video.title, video.channel);
      if (insights && insights.length > 0) {
        setAllVideoInsights(insights);
      }
    }
    
    getSpecificInsights();
  }, [video?.id, video.title, video.channel]);
  
  // Auto-scroll to bottom of notes
  useEffect(() => {
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedNotes, isGeneratingNote]);
  
  // Main Effect 1: Initial Reset & Burst (Only when Video Changes)
  useEffect(() => {
    if (!video) return;

    const rawNotes = topicNotes 
      ? topicNotes.split("\n")
          .filter(line => line.trim().startsWith("-") || line.trim().startsWith("*"))
          .map(n => n.replace(/^[-*]\s*/, ""))
      : ["Understanding the fundamental concepts", "Key terminology and definitions", "Core principles of the topic", "Advanced implementation patterns", "Common pitfalls and optimizations"];

    // Reset everything for the new video
    setIsAnalyzing(true);
    setStreamedNotes([]);
    nextIndexRef.current = 2; // Reset index back to after the burst
    
    const initialTimeout = setTimeout(() => {
      setStreamedNotes(rawNotes.slice(0, 2));
      setIsAnalyzing(false);
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, [video?.id]); // ONLY trigger on video change

  // Main Effect 2: Playback-Synced Pulse (Responsive to Pause/Play)
  useEffect(() => {
    if (!video || streamedNotes.length === 0) return;

    const rawNotes = topicNotes 
      ? topicNotes.split("\n")
          .filter(line => line.trim().startsWith("-") || line.trim().startsWith("*"))
          .map(n => n.replace(/^[-*]\s*/, ""))
      : ["Understanding the fundamental concepts", "Key terminology and definitions", "Core principles of the topic", "Advanced implementation patterns", "Common pitfalls and optimizations"];

    // Continuous Pulse: Add a new note every 18 seconds ONLY IF PLAYING
    const pulseInterval = setInterval(() => {
      if (!window.YT || !isPlaying) return; // SKIP if paused or not ready

      const currentSource = currentInsightsRef.current.length > 0 ? currentInsightsRef.current : rawNotes;
      
      if (nextIndexRef.current < currentSource.length) {
        setIsGeneratingNote(true);
        setTimeout(() => {
          setStreamedNotes(prev => [...prev, currentSource[nextIndexRef.current]]);
          setIsGeneratingNote(false);
          nextIndexRef.current++;
        }, 3000);
      } else {
        setIsGeneratingNote(true);
        setTimeout(() => {
          const fallbackInsights = [
            `Analysis completion check: The concepts in "${video.title}" have been fully mapped to your workspace.`,
            `Strategic insight: Focus on the architectural trade-offs discussed by ${video.channel}.`,
            "Academic summary: This lesson provides a baseline for advanced implementation in this domain."
          ];
          const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
          setStreamedNotes(prev => {
             if (prev[prev.length-1] === randomInsight) return prev;
             return [...prev, randomInsight];
          });
          setIsGeneratingNote(false);
        }, 5000);
      }
    }, 18000); 

    return () => clearInterval(pulseInterval);
  }, [video?.id, isPlaying, streamedNotes.length > 0]); // Trigger when playback changes

  if (!video) return null;

  const videoId = video.id;
  const origin = window.location.origin;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&origin=${origin}&widget_referrer=${origin}`;
  const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInYT = () => {
    window.open(shareUrl, "_blank");
  };

  const handleSaveWrapper = () => {
    onSave(video.title, video, "video");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  // Improved Synthesis Content
  const cleanSummary = topicSummary && !topicSummary.includes("may refer to") 
    ? topicSummary 
    : `This comprehensive video lesson on **${video.title}** dives into the core mechanics behind the topic. Our AI analysis has identified several key pedagogical pillars that help simplify complex theory into actionable knowledge.`;

  return (
    <div className="tp-video-analysis-overlay">
      <button className="tp-video-floating-back-btn" onClick={onClose} title="Back to Workspace">
        <ArrowLeft size={18} />
      </button>

      <main className="tp-video-analysis-content" style={{ paddingTop: '40px' }}>
        <section className="tp-video-analysis-player-section">
          <div className="tp-video-player-container">
            <div ref={playerDivRef}></div>
          </div>

          <div className="tp-video-details-card">
            <div className="tp-video-details-top">
              <div className="tp-video-main-info">
                <h2>{video.title}</h2>
                <div className="tp-video-channel-info">{video.channel}</div>
              </div>
              <div className="tp-video-actions">
                <button 
                  className={`tp-video-action-btn primary ${isSaved ? 'saved' : ''}`} 
                  onClick={handleSaveWrapper}
                >
                  {isSaved ? <Check size={18} /> : <Star size={18} />} {isSaved ? "Saved" : "Save"}
                </button>
                <button className="tp-video-action-btn" onClick={handleShare}>
                  {copied ? <Check size={18} color="#10B981" /> : <Share2 size={18} />} {copied ? "Copied" : "Share"}
                </button>
                <button className="tp-video-action-btn" onClick={handleOpenInYT}>
                  <ExternalLink size={18} /> YouTube
                </button>
              </div>
            </div>
            
            <div className="tp-video-description-box">
              {video.description || "Video analysis powered by StudyHub. Explore the key concepts and transcripts associated with this lesson to deepen your understanding."}
            </div>
          </div>
        </section>

        <aside className="tp-video-analysis-sidebar">
          <div className="tp-analysis-glass-card">
            <div className="tp-analysis-card-header">
              <div className="tp-analysis-card-icon">
                <FileText size={18} />
              </div>
              <h3>AI Synthesis</h3>
            </div>
            <div className="tp-analysis-card-content">
              {isAnalyzing && (
                <div className="tp-analyzing-indicator">
                  <div className="tp-pulse-dot"></div>
                  Synthesizing lecture...
                </div>
              )}
              <div className={isAnalyzing ? "tp-transparent-text" : "tp-analysis-streaming-text"}>
                <ReactMarkdown>
                  {cleanSummary}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="tp-analysis-glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="tp-analysis-card-header">
              <div className="tp-analysis-card-icon">
                <Layout size={18} />
              </div>
              <h3>Smart Notes</h3>
              <div className={`tp-live-analysis-badge ${!isPlaying ? 'paused' : ''}`}>
                <div className="tp-live-dot"></div>
                {isPlaying ? "LIVE ANALYSIS" : "PAUSED"}
              </div>
            </div>
            <div className="tp-analysis-card-content" ref={sidebarContentRef} style={{ flex: 1, overflowY: 'auto', marginTop: '10px', paddingRight: '12px' }}>
              <div className="tp-notes-list">
                {streamedNotes.map((note, idx) => (
                  <div key={idx} className="tp-note-item tp-smart-note-item">
                    <span className="tp-note-bullet">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                    <p style={{ margin: 0 }}>{note}</p>
                  </div>
                ))}
                
                {isGeneratingNote && (
                  <div className="tp-note-generating-loader">
                    <div><span></span><span></span><span></span></div>
                    Generating insight...
                  </div>
                )}
                <div ref={notesEndRef} />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TopicPage;
