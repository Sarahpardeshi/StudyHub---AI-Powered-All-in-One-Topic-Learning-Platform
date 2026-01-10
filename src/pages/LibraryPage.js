import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import "./LibraryPage.css";

const API_URL = "http://localhost:5006/api/library";

function LibraryPage() {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [groupedItems, setGroupedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        fetchLibrary();
    }, [token]);

    const fetchLibrary = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch library");
            const data = await response.json();
            setItems(data);
            groupItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const groupItems = (libraryItems) => {
        const groups = {};
        libraryItems.forEach(item => {
            const category = item.category || "General";
            if (!groups[category]) groups[category] = [];
            groups[category].push(item);
        });
        setGroupedItems(groups);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            // specific update
            const newItems = items.filter((item) => item._id !== id);
            setItems(newItems);
            groupItems(newItems);
        } catch (err) {
            alert("Failed to delete item");
        }
    };

    const NoteModal = ({ note, onClose }) => {
        if (!note) return null;
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2>{note.title}</h2>
                    <div className="modal-body markdown-preview">
                        {/* If we had a markdown renderer, we'd use it here. 
                 For now, displaying as whitespace-pre-wrap text is safer/easier 
                 unless we import ReactMarkdown again. 
                 Since the data.markdown is raw markdown, let's just show it. 
             */}
                        {note.data.markdown || note.data.content || JSON.stringify(note.data)}
                    </div>
                </div>
            </div>
        );
    };


    // Video Modal Component
    const VideoModal = ({ video, onClose }) => {
        if (!video) return null;
        // Extract ID just in case, though we usually save the full URL
        const videoId = video.data.url.split("v=")[1] || "";
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content video-modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2>{video.title}</h2>
                    <div className="modal-body video-body">
                        <iframe
                            src={embedUrl}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        );
    };

    const handleRenameCategory = async (oldCategory) => {
        const newCategory = prompt("Rename Category:", oldCategory);
        if (!newCategory || newCategory === oldCategory) return;

        try {
            const res = await fetch(`${API_URL}/category`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ oldCategory, newCategory }),
            });
            if (!res.ok) throw new Error("Failed to rename");

            // Refresh library
            fetchLibrary();
        } catch (err) {
            alert("Could not rename category");
        }
    };

    if (loading) return <div className="lib-loading">Loading Library...</div>;
    if (error) return <div className="lib-error">{error}</div>;

    return (
        <div className="lib-container">
            {/* Background Orbs */}
            <div className="lib-bg-orb lib-bg-orb--left" />
            <div className="lib-bg-orb lib-bg-orb--right" />

            {/* Glass Shell */}
            <main className="lib-shell">
                <header className="lib-header">
                    <h1>My Library</h1>
                    <p>Your collected knowledge, organized by topic.</p>
                </header>

                <div className="lib-content">
                    {Object.keys(groupedItems).length === 0 ? (
                        <div className="lib-empty">No saved items yet. Go search and save something!</div>
                    ) : (
                        Object.keys(groupedItems).map(category => (
                            <div key={category} className="lib-category-section">
                                <div className="lib-category-header-wrap">
                                    <h2 className="lib-category-title">{category}</h2>
                                    <button
                                        className="lib-edit-cat-btn"
                                        onClick={() => handleRenameCategory(category)}
                                        title="Rename Section"
                                    >
                                        ✎
                                    </button>
                                </div>
                                <div className="lib-grid">
                                    {groupedItems[category].map((item) => (
                                        <div key={item._id} className="lib-card">
                                            <div className="lib-card-header">
                                                <span className={`lib-badge badge-${item.type}`}>{item.type}</span>
                                                <button
                                                    className="lib-delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                                    title="Delete"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <h3 className="lib-card-title">{item.title}</h3>

                                            {/* Content Preview / Actions */}
                                            <div className="lib-card-body">
                                                {item.type === "note" && (
                                                    <div className="lib-card-content">
                                                        <p className="lib-note-preview">
                                                            {(item.data.markdown || "").substring(0, 100)}...
                                                        </p>
                                                    </div>
                                                )}

                                                {item.type === "video" && (
                                                    <div className="lib-card-content">
                                                        <div className="lib-thumbnail-wrapper">
                                                            <img src={item.data.thumbnail} alt="thumbnail" />
                                                            <div className="lib-play-overlay">▶</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {item.type === "book" && (
                                                    <div className="lib-card-content">
                                                        <div className="lib-book-wrapper">
                                                            {item.data.thumbnail ? (
                                                                <img src={item.data.thumbnail} alt="cover" />
                                                            ) : (
                                                                <div className="lib-book-placeholder">📖</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.type === "source" && (
                                                    <div className="lib-card-content">
                                                        <div className="lib-source-icon">🌐</div>
                                                        <p className="lib-source-domain">{new URL(item.data.url).hostname}</p>
                                                    </div>
                                                )}

                                                {/* Unified Footer Actions */}
                                                <div className="lib-card-footer">
                                                    {item.type === "note" && (
                                                        <button className="lib-btn-secondary full-width" onClick={() => setSelectedNote(item)}>
                                                            View Full Note
                                                        </button>
                                                    )}

                                                    {item.type === "video" && (
                                                        <div className="lib-video-actions">
                                                            <button
                                                                className="lib-btn-primary"
                                                                onClick={() => setSelectedVideo(item)}
                                                            >
                                                                Watch Here
                                                            </button>
                                                            <a
                                                                href={item.data.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="lib-btn-secondary"
                                                            >
                                                                New Tab ↗
                                                            </a>
                                                        </div>
                                                    )}

                                                    {item.type === "book" && (
                                                        <a href={item.data.url} target="_blank" rel="noreferrer" className="lib-btn-secondary full-width">
                                                            View Book ↗
                                                        </a>
                                                    )}

                                                    {item.type === "source" && (
                                                        <a href={item.data.url} target="_blank" rel="noreferrer" className="lib-btn-secondary full-width">
                                                            Visit Source ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {selectedNote && <NoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />}
            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );

}

export default LibraryPage;
