import React, { useState } from 'react';
import {
    Compass,
    Zap,
    Search,
    BookOpen,
    Atom,
    Code,
    Briefcase,
    Palette,
    Globe,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import './ExplorePage.css';

const CATEGORIES = [
    { id: 'cs', name: 'Computer Science', icon: <Code size={24} />, color: '#4F46E5', count: '1.2k topics' },
    { id: 'science', name: 'Natural Sciences', icon: <Atom size={24} />, color: '#8B5CF6', count: '850 topics' },
    { id: 'business', name: 'Business & Finance', icon: <Briefcase size={24} />, color: 'var(--primary)', count: '640 topics' },
    { id: 'arts', name: 'Arts & Humanities', icon: <Palette size={24} />, color: '#EC4899', count: '520 topics' },
    { id: 'global', name: 'Global Languages', icon: <Globe size={24} />, color: '#F59E0B', count: '310 topics' },
    { id: 'math', name: 'Mathematics', icon: <BookOpen size={24} />, color: '#10B981', count: '420 topics' },
];


const CONCEPTS = [
    {
        title: "Quantum Entanglement",
        category: "Quantum Physics",
        description: "A physical phenomenon that occurs when a pair of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle cannot be described independently of the state of the others.",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop"
    },
    {
        title: "The Golden Ratio",
        category: "Mathematics & Art",
        description: "A mathematical ratio commonly found in nature and art, believed to create aesthetically pleasing compositions and structural harmony in various organic forms.",
        image: "https://images.unsplash.com/photo-1509228468518-180dd48a5d5f?q=80&w=2070&auto=format&fit=crop"
    },
    {
        title: "Neural Plasticity",
        category: "Neuroscience",
        description: "The ability of the brain to undergo structural and functional changes in response to learning, experience, or injury, allowing for continuous adaptation throughout life.",
        image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=2070&auto=format&fit=crop"
    },
    {
        title: "Deep Sea Bioluminescence",
        category: "Marine Biology",
        description: "The production and emission of light by living organisms in the deep ocean, used for hunting, communication, and defense in a world of perpetual darkness.",
        image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=2070&auto=format&fit=crop"
    }
];

// Pick concept of the day based on date
const getConceptOfDay = () => {
    const day = new Date().getDate();
    return CONCEPTS[day % CONCEPTS.length];
};

const FEATURED_CONCEPT = getConceptOfDay();

function ExplorePage({ onStartTopic }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSurpriseMe = () => {
        const randomTopics = ["Dark Matter", "Renaissance Art", "Blockchain Technology", "Game Theory", "Photosynthesis", "Stoicism"];
        const picked = randomTopics[Math.floor(Math.random() * randomTopics.length)];
        onStartTopic(picked);
    };

    return (
        <div className="explore-container">
            {/* Hero Section: Concept of the Day */}
            <section className="explore-hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Zap size={14} className="badge-icon" />
                        Concept of the Day
                    </div>
                    <h1 className="hero-title">{FEATURED_CONCEPT.title}</h1>
                    <p className="hero-desc">{FEATURED_CONCEPT.description}</p>
                    <div className="hero-actions">
                        <button
                            className="hero-primary-btn"
                            onClick={() => onStartTopic(FEATURED_CONCEPT.title)}
                        >
                            Deep Dive Now <ArrowRight size={18} />
                        </button>
                        <span className="hero-category">{FEATURED_CONCEPT.category}</span>
                    </div>
                </div>
                <div className="hero-visual">
                    <img src={FEATURED_CONCEPT.image} alt="Featured" />
                    <div className="visual-overlay"></div>
                </div>
            </section>

            {/* Search & Discover Bar */}
            <div className="explore-search-section">
                <div className="explore-search-box">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search the Knowledge Universe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchTerm && onStartTopic(searchTerm)}
                    />
                </div>
            </div>

            {/* Categories Grid */}
            <section className="explore-section">
                <div className="section-header">
                    <h2 className="section-title">Explore by Domain</h2>
                    <p className="section-subtitle">Broaden your horizons across major fields of study</p>
                </div>
                <div className="categories-grid">
                    {CATEGORIES.map(cat => (
                        <div
                            key={cat.id}
                            className="category-card"
                            onClick={() => onStartTopic(cat.name)}
                            style={{ '--cat-color': cat.color }}
                        >
                            <div className="cat-icon-wrapper">
                                {cat.icon}
                            </div>
                            <h3 className="cat-name">{cat.name}</h3>
                            <span className="cat-count">{cat.count}</span>
                        </div>
                    ))}
                </div>
            </section>


            {/* Floating Surprise Button (Extra accessibility) */}
            <button className="floating-surprise-fab" onClick={handleSurpriseMe} title="Surprise Me!">
                <RefreshCw size={24} />
            </button>
        </div>
    );
}

export default ExplorePage;
