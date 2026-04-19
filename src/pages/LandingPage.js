import React, { useEffect, useState } from "react";
import "./LandingPage.css";
import { motion } from "framer-motion";
import SearchBar from "../components/SearchBar.js";
import { fetchYoutubeVideos } from "../services/youtubeApi.js";
import { VideoAutoSlider } from "../components/ui/video-auto-slider.js";
import { AuroraBackground } from "../components/ui/aurora-background.js";
import { Github, Twitter, Linkedin } from "lucide-react";
import { SuggestedTopicGrid } from "../components/SuggestedTopicGrid.js";

import logo from "../assets/studyhub_logo.png";

const TOPIC_MAP = {
  "Machine Learning": ["Neural Networks", "Deep Learning", "Data Science", "Python"],
  "Data Structures": ["Algorithms", "C++", "Java", "Computer Science"],
  "Cloud Computing": ["AWS", "Docker", "DevOps", "Cybersecurity"],
  "React": ["Javascript", "Web Development", "Frontend", "Next.js"],
  "Physics": ["Quantum Mechanics", "Relativity", "Astrophysics", "Calculus"],
  "History": ["World War II", "Ancient Rome", "Renaissance", "Archaeology"],
  "Business": ["Marketing", "Economics", "Entrepreneurship", "Finance"],
  "Psychology": ["Cognitive Science", "Mental Health", "Behavioral Therapy", "Social Science"]
};

const DEFAULT_TOPICS = ["Machine Learning", "Quantum Physics", "Modern History", "Data Structures", "Psychology", "Economics", "Cybersecurity", "React"];

const FALLBACK_VIDEOS = [
  { id: "mw_XSTG3mYI", title: "Machine Learning for Beginners", channel: "Simplilearn", thumbnail: "https://i.ytimg.com/vi/mw_XSTG3mYI/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=mw_XSTG3mYI" },
  { id: "v=yN7ypxC7838", title: "Quantum Physics for 7 Year Olds", channel: "Dominic Walliman", thumbnail: "https://i.ytimg.com/vi/yN7ypxC7838/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=yN7ypxC7838" },
  { id: "RBSGKlAvoiM", title: "Introduction to Data Structures", channel: "mycodeschool", thumbnail: "https://i.ytimg.com/vi/RBSGKlAvoiM/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=RBSGKlAvoiM" },
  { id: "SccSCuHhbc0", title: "React JS Crash Course 2024", channel: "Traversy Media", thumbnail: "https://i.ytimg.com/vi/SccSCuHhbc0/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=SccSCuHhbc0" },
  { id: "f_XG_8G-qYI", title: "Cloud Computing Explained", channel: "IBM Technology", thumbnail: "https://i.ytimg.com/vi/f_XG_8G-qYI/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=f_XG_8G-qYI" },
  { id: "X37E6N_N0S8", title: "World War II - Summary", channel: "OverSimplified", thumbnail: "https://i.ytimg.com/vi/X37E6N_N0S8/maxresdefault.jpg", url: "https://www.youtube.com/watch?v=X37E6N_N0S8" }
];

function LandingPage({ onStartTopic, onOpenExplore, history = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (item) => {
    if (typeof item === 'object' && item.title) {
      onStartTopic(item.title, null, { initialPanel: "YouTube Videos", initialVideo: item });
    } else {
      onStartTopic(item);
    }
  };

  const recentSearches = history.slice(0, 4);

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        let topicsToFetch = [];

        if (recentSearches.length > 0) {
          // 1. Get exact topics from history
          const exactTopics = recentSearches.slice(0, 2).map(s => s.topic);

          // 2. Find similar topics using TOPIC_MAP
          let related = [];
          exactTopics.forEach(t => {
            const entry = Object.entries(TOPIC_MAP).find(([key]) => t.toLowerCase().includes(key.toLowerCase()));
            if (entry) related = [...related, ...entry[1]];
          });

          topicsToFetch = [...new Set([...exactTopics, ...related])].sort(() => 0.5 - Math.random()).slice(0, 4);
        } else {
          // Default study variety for new users
          topicsToFetch = DEFAULT_TOPICS.sort(() => 0.5 - Math.random()).slice(0, 4);
        }

        setSuggestedTopics(topicsToFetch);

        // Fetch videos for selected topics
        const videoPromises = topicsToFetch.map(topic =>
          fetchYoutubeVideos(topic).catch(err => {
            console.error(`Failed to fetch videos for ${topic}:`, err);
            return [];
          })
        );
        const results = await Promise.all(videoPromises);

        const allVideos = results.flat();
        const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());

        // Fallback if API is down/empty
        const suggestionsToShow = uniqueVideos.length >= 4
          ? uniqueVideos
          : FALLBACK_VIDEOS.sort(() => 0.5 - Math.random());

        setSuggestions(suggestionsToShow.slice(0, 12));
      } catch (err) {
        console.error("Failed to load suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [history.length, recentSearches]);


  return (
    <div className="lp-root">
      <AuroraBackground>
        <main className="lp-container">
          <header className="lp-hero">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="lp-hero-title">
                What do you want to master <br /> today?
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="lp-search-wrapper">
                <SearchBar onSearch={handleSearch} placeholder="Search AI-powered topics, courses, or workspaces..." variant="default" />
              </div>

              <div className="lp-recent-searches">
                <span className="recent-label">Recent Searches:</span>
                {recentSearches.length > 0 ? (
                  recentSearches.map((item, idx) => (
                    <button key={item._id || idx} className="lp-tag" onClick={() => handleSearch(item.topic)}>
                      <span className="tag-icon">🕒</span> {item.topic}
                    </button>
                  ))
                ) : (
                  <span className="no-recent">No recent searches yet</span>
                )}
              </div>
            </motion.div>
          </header>

          <section className="lp-section">
            <div className="lp-section-header">
              <div>
                <h2 className="lp-section-title">Suggested Topics for You</h2>
                <p className="lp-section-subtitle">Jump into a module based on your interests</p>
              </div>
              <button className="lp-view-all" onClick={onOpenExplore}>Explore all →</button>
            </div>

            <SuggestedTopicGrid
              topics={suggestedTopics}
              onTopicClick={handleSearch}
            />
          </section>

          <section className="lp-section" style={{ marginTop: '3rem' }}>
            <div className="lp-section-header">
              <div>
                <h2 className="lp-section-title">Suggested Videos</h2>
                <p className="lp-section-subtitle">Hand-picked lessons for your current path</p>
              </div>
              <button className="lp-view-all" onClick={onOpenExplore}>View all →</button>
            </div>

            <div className="lp-slider-container">
              {loading ? (
                <div className="flex gap-6 overflow-hidden px-4 py-8">
                  {[1, 2, 3, 4].map(i => <div key={i} className="flex-shrink-0 w-64 md:w-80 aspect-video rounded-2xl bg-slate-200 animate-pulse"></div>)}
                </div>
              ) : (
                <VideoAutoSlider
                  videos={suggestions}
                  onVideoClick={handleSearch}
                />
              )}
            </div>
          </section>
        </main>
      </AuroraBackground>

      <footer className="lp-footer">
        <div className="lp-footer-container">
          <div className="lp-footer-grid">
            {/* Brand Column */}
            <div className="lp-footer-col brand">
              <div className="lp-footer-logo">
                <img src={logo} alt="StudyHub" className="footer-logo-img" style={{ width: '92px', height: '92px', marginRight: '16px', objectFit: 'contain' }} />
                <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>StudyHub</span>
              </div>
              <p className="lp-footer-tagline">
                The ultimate AI-powered workspace for mastering complex topics faster than ever before.
              </p>
              <div className="lp-footer-social">
                <a href="#!"><Twitter size={18} /></a>
                <a href="#!"><Github size={18} /></a>
                <a href="#!"><Linkedin size={18} /></a>
              </div>
            </div>

            {/* Explore Column */}
            <div className="lp-footer-col">
              <h4>Explore</h4>
              <ul>
                <li><a href="#search">Smart Search</a></li>
                <li><a href="#library">Your Library</a></li>
                <li><a href="#trending">Trending Topics</a></li>
                <li><a href="#premium">Premium Plans</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="lp-footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p>© 2024 StudyHub AI. Built for the future of learning.</p>
            <div className="lp-footer-status">
              <div className="status-dot"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
