# PRD: StudyHub — AI-Powered Learning Platform

## 1. Executive Summary
**StudyHub** is a next-generation, AI-driven educational platform designed to transform how students and lifelong learners consume information. By leveraging advanced LLMs, it converts any search query into a comprehensive, interactive study suite including guided notes, videos, books, and self-assessment tools.

---

## 2. Product Vision & Goals
- **Vision**: To be the primary "knowledge bridge" between a simple curiosity and deep topical mastery.
- **Primary Goals**:
    - **Efficiency**: Reduce "search fatigue" by consolidating diverse resources (notes, videos, books) in one view.
    - **Retention**: Move beyond passive reading with active learning tools like AI Quizzes and Flashcards.
    - **Personalization**: Use chat-driven interaction to adapt learning materials to user-specific questions.

---

## 3. Core Features (Functional Requirements)

### 3.1 AI Study Engine
- **Global Search**: A persistent, unified search bar allowing users to input any topic.
- **AI Notes**: Real-time generation of structured study notes (Markdown support).
- **Interactive Chat**: A "Study Buddy" interface for follow-up questions within the context of the generated notes.

### 3.2 Integrated Resource Panels (The "Focused View")
- **YouTube Videos**: Curated educational videos for visual learners.
- **Reference Books**: Academic book suggestions with direct links to Google Books.
- **Web Sources**: High-authority web articles for broader context.

### 3.3 Active Learning Suite
- **AI Quizzes**: Generation of 5-question MCQs based on the specific AI notes. Includes scoring, correct/incorrect feedback, and specialized review modals.
- **Adaptive Flashcards**: Automatic extraction of key concepts into a "deck" format. Supports "Adaptive" mode where new cards are added based on user-chat interactions.

### 3.4 Persistence & Library
- **AI Notebook**: Automatic saving of search history and generated note content.
- **The Library**: A personal repository where users can save specific cards (Quizzes, Videos, Books, Sources) for permanent reference.
- **Quiz Review**: Capability to revisit saved quiz attempts and review performance details.

---

## 4. User Experience & Design (UX/UI)
- **Aesthetic**: Premium "Glassmorphism" design. Uses soft blurs, vibrant gradients, and high transparency to create a modern, high-end feel.
- **Layout**: 
    - **Tile View**: An "at-a-glance" grid for exploring sub-components of a topic.
    - **Focused View**: A clean, two-column layout for deep study, featuring a scrollable sidebar for rapid navigation.
- **Responsiveness**: Fully fluid layout that adapts from mobile (drawer sidebar) to wide desktop (persistent sidebar).

---

## 5. Technical Architecture
- **Frontend**: React.js with Vanilla CSS (Modern Design Tokens).
- **Backend**: Node.js & Express.
- **Database**: MongoDB (Storage for Users, History, and Library Items).
- **APIs**:
    - **LLM/AI**: OpenRouter/OpenAI for Note, Quiz, and Flashcard generation.
    - **Video**: YouTube Data API.
    - **Books**: Google Books API.
    - **Search**: Serper.dev (for web sources).
- **Security**: JWT-based authentication with Google OAuth integration.

---

## 6. Future Roadmap
- **Collaboration**: Shared libraries and group study rooms.
- **Deep PDF Analysis**: Allowing users to upload their own textbooks for AI processing.
- **Gamification**: Badges and streaks for quiz performance and daily learning.
- **Voice Mode**: Audio-based summaries for learning on the go.
