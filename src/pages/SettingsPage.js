import React, { useState, useRef, useEffect } from "react";
import {
    User,
    Sparkles,
    Palette,
    Zap,
    Book,
    CheckCircle2,
    Save,
    X,
    DraftingCompass,
    GraduationCap,
    Clock,
    Camera,
    Lock,
    Mail,
    Trash2,
    Plus,
    LogOut
} from "lucide-react";
import "./SettingsPage.css";
import { useAuth } from "../context/AuthContext.js";

const SIDEBAR_ITEMS = [
    { id: "profile", label: "Profile", icon: <User size={20} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
];

const COLORS = [
    { id: "indigo", color: "#4F46E5", hover: "#4338CA", soft: "rgba(79, 70, 229, 0.1)" },
    { id: "purple", color: "#8B5CF6", hover: "#7C3AED", soft: "rgba(139, 92, 246, 0.1)" },
    { id: "teal", color: "#06B6D4", hover: "#0891B2", soft: "rgba(6, 182, 212, 0.1)" },
    { id: "pink", color: "#EC4899", hover: "#DB2777", soft: "rgba(236, 72, 153, 0.1)" },
    { id: "amber", color: "#F59E0B", hover: "#D97706", soft: "rgba(245, 158, 11, 0.1)" },
];

const setAccentTheme = (colorObj) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colorObj.color);
    root.style.setProperty('--primary-hover', colorObj.hover);
    root.style.setProperty('--primary-soft', colorObj.soft);
    localStorage.setItem('studyhub_accent_id', colorObj.id);
};

function SettingsPage({ onBack, user }) {
    const { updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [explainerStyle, setExplainerStyle] = useState(() => localStorage.getItem('studyhub_explainer_style') || "deep");
    const [complexity, setComplexity] = useState(() => localStorage.getItem('studyhub_complexity') || "Specialist");
    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('studyhub_accent_id') || "indigo";
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    // Camera States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    const [automaticSettings, setAutomaticSettings] = useState(() => {
        const saved = localStorage.getItem('studyhub_auto_settings');
        return saved ? JSON.parse(saved) : {
            flashcards: true,
            notes: true,
            quiz: false,
        };
    });

    const handleColorChange = (c) => {
        setAccentColor(c.id);
    };

    const handleSave = () => {
        setIsSaving(true);
        
        // Apply Accent Theme on Save
        const selectedColorObj = COLORS.find(c => c.id === accentColor) || COLORS[0];
        setAccentTheme(selectedColorObj);

        // Persist Settings
        localStorage.setItem('studyhub_explainer_style', explainerStyle);
        localStorage.setItem('studyhub_complexity', complexity);
        localStorage.setItem('studyhub_auto_settings', JSON.stringify(automaticSettings));
        localStorage.setItem('studyhub_user_profile', JSON.stringify({
            name: profile.name,
            bio: profile.bio,
            avatar: profile.avatar
        }));

        // Update global auth state
        updateUser({
            username: profile.name,
            bio: profile.bio,
            avatar: profile.avatar
        });

        // Simulate API delay
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 800);
    };

    // Profile State
    const [profile, setProfile] = useState(() => {
        const savedProfile = localStorage.getItem('studyhub_user_profile');
        const profileData = savedProfile ? JSON.parse(savedProfile) : {};

        return {
            name: user?.username || profileData.name || "Sarah Pardeshi",
            bio: profileData.bio || user?.bio || "Computer Science student passionate about Machine Learning and AI-driven study tools.",
            avatar: profileData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || profileData.name || "Sarah Pardeshi"}`,
            email: user?.email || "sarah.p@university.edu",
            isEmailVerified: true
        };
    });

    const toggleSetting = (key) => {
        setAutomaticSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Avatar Handlers
    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newAvatar = reader.result;
                setProfile({ ...profile, avatar: newAvatar });

                // Persist instantly
                const savedProfile = JSON.parse(localStorage.getItem('studyhub_user_profile') || '{}');
                const updatedProfile = { ...savedProfile, avatar: newAvatar, name: profile.name };
                localStorage.setItem('studyhub_user_profile', JSON.stringify(updatedProfile));

                updateUser({
                    ...user,
                    avatar: newAvatar,
                    username: profile.name
                });

                setShowAvatarModal(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            setIsCameraActive(true);
            // We'll handle srcObject in a useEffect to ensure video element exists
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Please grant camera permissions to take a selfie.");
        }
    };

    // Fix for camera preview not showing
    useEffect(() => {
        if (isCameraActive && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [isCameraActive, cameraStream]);

    const stopCamera = React.useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    }, [cameraStream]);

    const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        if (video) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            setProfile({ ...profile, avatar: dataUrl });

            // Persist instantly
            const savedProfile = JSON.parse(localStorage.getItem('studyhub_user_profile') || '{}');
            const updatedProfile = { ...savedProfile, avatar: dataUrl, name: profile.name };
            localStorage.setItem('studyhub_user_profile', JSON.stringify(updatedProfile));

            updateUser({
                ...user,
                avatar: dataUrl,
                username: profile.name
            });

            stopCamera();
            setShowAvatarModal(false);
        }
    };

    const handleRemovePhoto = () => {
        const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.name}`;
        setProfile({ ...profile, avatar: defaultAvatar });

        // Persist instantly
        const savedProfile = JSON.parse(localStorage.getItem('studyhub_user_profile') || '{}');
        const updatedProfile = { ...savedProfile, avatar: defaultAvatar, name: profile.name };
        localStorage.setItem('studyhub_user_profile', JSON.stringify(updatedProfile));

        updateUser({
            ...user,
            avatar: defaultAvatar,
            username: profile.name
        });

        setShowAvatarModal(false);
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className="settings-root">
            <aside className="settings-sidebar">
                <div className="settings-sidebar-header">
                    <span className="settings-sidebar-label">SETTINGS</span>
                </div>
                <nav className="settings-nav">
                    {SIDEBAR_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`settings-nav-item ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span className="settings-nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="settings-sidebar-footer">
                    
                    
                    <button 
                        className="settings-logout-btn" 
                        onClick={logout} 
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </aside>

            <main className="settings-content">
                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                    <div className="settings-tab-view profile-view">
                        <div className="settings-content-header">
                            <h1>Account & Profile</h1>
                            <p>Manage your public profile and principal login credentials.</p>
                        </div>

                        <div className="settings-section profile-info-section">
                            <h3 className="section-title">Profile Information</h3>
                            <div className="profile-edit-grid">
                                <div className="avatar-upload-area">
                                    <div className="profile-avatar-large">
                                        <img src={profile.avatar} alt="Avatar" />
                                        <button
                                            className="avatar-edit-overlay"
                                            title="Change Avatar"
                                            onClick={() => setShowAvatarModal(true)}
                                        >
                                            <Camera size={20} />
                                        </button>
                                    </div>
                                    <p className="avatar-hint">JPG, GIF or PNG. 1MB Max.</p>
                                </div>

                                <div className="profile-fields">
                                    <div className="input-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Bio</label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3 className="section-title">Account Settings</h3>
                            <div className="account-settings-grid">
                                <div className="email-card-inner">
                                    <div className="email-header">
                                        <div className="email-icon-box">
                                            <Mail size={22} />
                                        </div>
                                        <div className="email-details">
                                            <div className="label-with-badge">
                                                <label>Primary Email</label>
                                                {profile.isEmailVerified && <span className="verified-status"><CheckCircle2 size={12} /> VERIFIED</span>}
                                            </div>
                                            <div className="current-email-display">{profile.email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="email-card-inner">
                                    <div className="email-header">
                                        <div className="email-icon-box sec-icon">
                                            <Lock size={22} />
                                        </div>
                                        <div className="email-details">
                                            <label>Access Security</label>
                                            <div className="current-email-display">••••••••••••</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {showAvatarModal && (
                            <div className="settings-modal-overlay">
                                <div className="settings-modal-card avatar-modal">
                                    <div className="modal-header">
                                        <h3>Update Profile Picture</h3>
                                        <button className="close-btn" onClick={() => { setShowAvatarModal(false); stopCamera(); }}><X size={20} /></button>
                                    </div>
                                    <div className="modal-body">
                                        {isCameraActive ? (
                                            <div className="camera-preview-container">
                                                <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                                                <div className="camera-controls">
                                                    <button className="capture-btn" onClick={capturePhoto}>
                                                        <div className="inner-circle"></div>
                                                    </button>
                                                    <button className="retake-btn" onClick={stopCamera}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="avatar-options-grid">
                                                <button className="avatar-option-card" onClick={handleFileClick}>
                                                    <div className="option-icon"><Plus size={24} /></div>
                                                    <h4>Upload Photo</h4>
                                                    <p>From your device</p>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        style={{ display: 'none' }}
                                                        accept="image/*"
                                                    />
                                                </button>
                                                <button className="avatar-option-card" onClick={startCamera}>
                                                    <div className="option-icon"><Camera size={24} /></div>
                                                    <h4>Take Selfie</h4>
                                                    <p>Using your camera</p>
                                                </button>
                                                <button className="avatar-option-card remove-card" onClick={handleRemovePhoto}>
                                                    <div className="option-icon remove"><Trash2 size={24} /></div>
                                                    <h4>Remove</h4>
                                                    <p>Back to default</p>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STUDY SETTINGS TAB */}
                {activeTab === "study" && (
                    <div className="settings-tab-view ai-view">
                        <div className="settings-content-header">
                            <h1>Study Settings</h1>
                            <p>Customize how your AI assistant interprets and generates learning materials.</p>
                        </div>

                        <div className="settings-section">
                            <h3 className="section-title">Explainer Style</h3>
                            <div className="explainer-cards">
                                <div
                                    className={`explainer-card ${explainerStyle === "concise" ? "active" : ""}`}
                                    onClick={() => setExplainerStyle("concise")}
                                >
                                    <div className="card-icon concise">
                                        <Zap size={24} />
                                    </div>
                                    <div className="card-content">
                                        <h4>Concise</h4>
                                        <p>Fast, punchy summaries that focus on key takeaways and immediate action items.</p>
                                    </div>
                                </div>

                                <div
                                    className={`explainer-card ${explainerStyle === "deep" ? "active" : ""}`}
                                    onClick={() => setExplainerStyle("deep")}
                                >
                                    <div className="card-icon deep">
                                        <Book size={24} />
                                    </div>
                                    <div className="card-content">
                                        <h4>Deep Dive</h4>
                                        <p>In-depth explanations with historical context, cross-references, and detailed nuance.</p>
                                        {explainerStyle === "deep" && <span className="active-badge">ACTIVE</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="settings-row">
                            <div className="settings-col">
                                <h3 className="section-title">Default Complexity</h3>
                                <div className="complexity-selector">
                                    <GraduationCap size={18} className="selector-icon" />
                                    <select
                                        value={complexity}
                                        onChange={(e) => setComplexity(e.target.value)}
                                    >
                                        <option>Novice</option>
                                        <option>Intermediate</option>
                                        <option>Specialist</option>
                                        <option>Master</option>
                                    </select>
                                </div>
                                <p className="field-hint">AI will adapt terminology and concept depth to this level.</p>
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3 className="section-title">Automatic Content Generation</h3>
                            <div className="toggle-list">
                                <div className="toggle-item" onClick={() => toggleSetting("flashcards")}>
                                    <div className="toggle-info">
                                        <div className="toggle-icon-wrap">
                                            <Clock size={16} />
                                        </div>
                                        <div className="toggle-text">
                                            <h4>Generate Flashcards</h4>
                                            <p>Automatically extract terms for SRS review</p>
                                        </div>
                                    </div>
                                    <div className={`checkbox ${automaticSettings.flashcards ? "checked" : ""}`}>
                                        {automaticSettings.flashcards && <CheckCircle2 size={20} />}
                                    </div>
                                </div>

                                <div className="toggle-item" onClick={() => toggleSetting("notes")}>
                                    <div className="toggle-info">
                                        <div className="toggle-icon-wrap">
                                            <DraftingCompass size={16} />
                                        </div>
                                        <div className="toggle-text">
                                            <h4>Draft Notes</h4>
                                            <p>Create structured outlines from uploaded docs</p>
                                        </div>
                                    </div>
                                    <div className={`checkbox ${automaticSettings.notes ? "checked" : ""}`}>
                                        {automaticSettings.notes && <CheckCircle2 size={20} />}
                                    </div>
                                </div>

                                <div className="toggle-item" onClick={() => toggleSetting("quiz")}>
                                    <div className="toggle-info">
                                        <div className="toggle-icon-wrap">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="toggle-text">
                                            <h4>Create Quiz</h4>
                                            <p>Benchmark your knowledge after every session</p>
                                        </div>
                                    </div>
                                    <div className={`checkbox ${automaticSettings.quiz ? "checked" : ""}`}>
                                        {automaticSettings.quiz && <CheckCircle2 size={20} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === "appearance" && (
                    <div className="settings-tab-view appearance-view">
                        <div className="settings-content-header">
                            <h1>Appearance</h1>
                            <p>Customize the look and feel of your StudyHub workspace.</p>
                        </div>

                        <div className="settings-section">
                            <h3 className="section-title">Accent Color</h3>
                            <div className="color-picker-grid">
                                <div className="color-picker-card">
                                    <div className="color-picker">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                className={`color-swatch ${accentColor === c.id ? "active" : ""}`}
                                                style={{ backgroundColor: c.color }}
                                                onClick={() => handleColorChange(c)}
                                            >
                                                {accentColor === c.id && <CheckCircle2 size={14} color="#fff" />}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="field-hint">Choose a color that motivates your study sessions.</p>
                                </div>
                            </div>
                        </div>

                        <div className="coming-soon-mini">
                            <Palette size={24} className="coming-soon-icon" />
                            <div>
                                <h4>Advanced Themes Underway</h4>
                                <p>Dynamic Glassmorphism and specialized dark-mode presets are being calibrated.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* COMING SOON TABS */}
                {(activeTab === "notifications") && (
                    <div className="settings-tab-view empty-view">
                        <div className="settings-content-header">
                            <h1>{SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label}</h1>
                            <p>This section is currently under development to bring you even more customization options.</p>
                        </div>
                        <div className="coming-soon-card">
                            <Sparkles size={40} className="coming-soon-icon" />
                            <h3>Coming Soon</h3>
                            <p>We're working on advanced {activeTab} controls for a more tailored learning experience.</p>
                        </div>
                    </div>
                )}

                <div className="settings-footer">
                    <button className="cancel-btn" onClick={onBack}>Cancel Changes</button>
                    <button
                        className={`save-btn ${saveSuccess ? "success" : ""}`}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <div className="save-loader"></div>
                        ) : saveSuccess ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        {isSaving ? "Saving..." : saveSuccess ? "Preferences Saved!" : "Save Preferences"}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default SettingsPage;
