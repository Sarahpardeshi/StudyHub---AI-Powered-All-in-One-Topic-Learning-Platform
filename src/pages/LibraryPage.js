import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import ReactMarkdown from "react-markdown";
import {
    LayoutGrid,
    Lightbulb,
    FileText,
    Video,
    BookOpen,
    Globe,
    LogOut,
    Diamond,
    Package
} from "lucide-react";
import "./LibraryPage.css";

const API_URL = "http://localhost:5006/api/library";

const SIDEBAR_NAV = [
    { id: "All", label: "All Items", icon: <Diamond size={18} /> },
    { id: "Note", label: "Smart Notes", icon: <Lightbulb size={18} /> },
    { id: "Quiz", label: "Test Results", icon: <FileText size={18} /> },
    { id: "Video", label: "Video Lessons", icon: <Video size={18} /> },
    { id: "Book", label: "Reading List", icon: <BookOpen size={18} /> },
    { id: "Source", label: "Web Sources", icon: <Globe size={18} /> }
];

function LibraryPage() {
    const { token, logout } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    // Modal State
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        if (token) {
            fetchLibrary();
        }
    }, [token]);

    const fetchLibrary = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch library");
            const data = await response.json();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) {
                logout();
                return;
            }
            setItems(prev => prev.filter(item => item._id !== id));
            setToastMessage("Item removed from Library!");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            setToastMessage("Failed to delete item.");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const NoteModal = ({ note, onClose }) => {
        if (!note) return null;
        const noteContent = typeof note.data === 'string'
            ? note.data
            : (note.data.markdown || note.data.content || "");
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2>{note.title}</h2>
                    <div className="tp-markdown">
                        <ReactMarkdown>{noteContent}</ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    };

    const VideoModal = ({ video, onClose }) => {
        if (!video) return null;
        let videoId = video.data.id || "";
        if (!videoId && video.data.url) {
            videoId = video.data.url.split("v=")[1] || video.data.url.split("/").pop();
        }
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" style={{ padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={embedUrl}
                            title={video.title}
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div style={{ padding: '30px' }}>
                        <h2>{video.title}</h2>
                    </div>
                </div>
            </div>
        );
    };

    const QuizModal = ({ quiz, onClose }) => {
        if (!quiz) return null;
        const { score, total, questions } = quiz.data;
        const percentage = Math.round((score / total) * 100);
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2 style={{ marginBottom: '40px' }}>{quiz.title}</h2>
                    <div className="lib-quiz-result-hero" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{ fontSize: '4rem', fontWeight: 800, color: '#4F46E5' }}>{percentage}%</div>
                        <p style={{ color: '#64748B' }}>Score: {score} / {total}</p>
                    </div>
                    <div className="lib-quiz-review">
                        {questions?.map((q, idx) => {
                            const userSelected = q.options[q.userIndex];
                            const correctAnswer = q.options[q.correctIndex];
                            const isCorrect = q.userIndex === q.correctIndex;

                            return (
                                <div key={idx} style={{
                                    background: '#F8FAFC',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    marginBottom: '16px',
                                    border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    <p style={{ fontWeight: 600, marginBottom: '12px' }}>{q.question}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ color: isCorrect ? '#10B981' : '#EF4444', fontSize: '14px' }}>
                                            <strong>Your Answer:</strong> {userSelected || "No answer"}
                                        </p>
                                        {!isCorrect && (
                                            <p style={{ color: '#10B981', fontSize: '14px' }}>
                                                <strong>Correct:</strong> {correctAnswer}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const filteredItems = items.filter(item => {
        if (filter === "All") return true;
        return item.type === filter.toLowerCase();
    });

    if (loading) return <div className="lib-root" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="tp-spinner"></div></div>;

    return (
        <div className="lib-root">
            <aside className="lib-sidebar">
                <div className="lib-sidebar-brand">StudyHub.Library</div>
                <div className="lib-nav-group">
                    <div className="lib-nav-label">Collections</div>
                    {SIDEBAR_NAV.map(nav => (
                        <button
                            key={nav.id}
                            className={`lib-nav-item ${filter === nav.id ? 'active' : ''}`}
                            onClick={() => setFilter(nav.id)}
                        >
                            <span className="lib-nav-icon">{nav.icon}</span>
                            {nav.label}
                        </button>
                    ))}
                </div>

                <div className="lib-accent-bar" style={{ background: 'var(--primary)' }}></div>
                <div className="lib-nav-group" style={{ marginTop: 'auto' }}>
                    <div className="lib-nav-label">Settings</div>
                    <button className="lib-nav-item logout" onClick={logout}>
                        <span className="lib-nav-icon"><LogOut size={18} /></span>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="lib-main">
                <header className="lib-header">
                    <div className="lib-title-area">
                        <h1>{SIDEBAR_NAV.find(n => n.id === filter)?.label || "Library"}</h1>
                        <p>{filteredItems.length} items collected</p>
                    </div>
                    <div className="lib-controls">
                        <div className="lib-view-toggle">
                            <button
                                className={`lib-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                🔲
                            </button>
                            <button
                                className={`lib-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                ≡
                            </button>
                        </div>
                    </div>
                </header>

                {filteredItems.length === 0 ? (
                    <div className="lib-empty">
                        <span className="lib-empty-icon"><Package size={64} style={{ opacity: 0.2, marginBottom: '16px' }} /></span>
                        <h3>No items in this collection yet</h3>
                        <p>Items you save during your deep study will appear here.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'lib-grid' : 'lib-list'}>
                        {filteredItems.map(item => (
                            <div
                                key={item._id}
                                className="lib-card"
                                onClick={() => {
                                    if (item.type === 'note') setSelectedNote(item);
                                    else if (item.type === 'video') setSelectedVideo(item);
                                    else if (item.type === 'quiz') setSelectedQuiz(item);
                                    else {
                                        const externalUrl = item.data.url || item.data.link;
                                        if (externalUrl) window.open(externalUrl, '_blank');
                                    }
                                }}
                            >
                                <span className="lib-card-type">{item.type}</span>
                                <h3 className="lib-card-title">{item.title}</h3>
                                <div className="lib-card-footer">
                                    <div className="lib-card-meta">
                                        <span className="lib-category-tag">{item.category || "General"}</span>
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className="lib-card-action-btn" onClick={(e) => handleDelete(e, item._id)}>
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {selectedNote && <NoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />}
            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
            {selectedQuiz && <QuizModal quiz={selectedQuiz} onClose={() => setSelectedQuiz(null)} />}

            {toastMessage && (
                <div className="lib-toast">
                    ✓ {toastMessage}
                </div>
            )}
        </div>
    );
}

export default LibraryPage;
