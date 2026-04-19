// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import http from "http";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { PDFParse } from "pdf-parse";

import { User } from "./src/models/User.js";
import { History } from "./src/models/History.js";
import { LibraryItem } from "./src/models/LibraryItem.js";

dotenv.config();

const app = express();
const PORT = process.env.NOTES_PORT || 5006;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_dev";
const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

// Middleware
app.use(cors());
app.use(express.json({ limit: "500mb" })); // Increased limit for larger files
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// --- File Upload Middleware ---
const upload = multer({ storage: multer.memoryStorage() });

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`Response: ${res.statusCode}`);
  });
  next();
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    console.log("Auth Error: No token provided");
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Auth Error: Invalid token", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    console.log(`Auth Success: UserID=${user.userId}`);
    req.user = user; // { userId: ... }
    next();
  });
};

// --- AUTH ROUTES ---

// --- PDF Extraction Route ---
app.post("/api/extract-pdf", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const parser = new PDFParse({ data: req.file.buffer });
    const data = await parser.getText();
    res.json({ text: data.text });
  } catch (err) {
    console.error("PDF Extraction Error:", err);
    res.status(500).json({ error: "Failed to extract text from PDF" });
  }
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Google Login
app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, sub: googleId, picture } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google
      user = new User({
        username: name,
        email,
        googleId,
        avatar: picture,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google to existing account if email matches
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(400).json({ error: "Google authentication failed" });
  }
});


// --- HISTORY ROUTES ---

app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log(`Fetching history for UserID: ${userId}`);
    const history = await History.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (err) {
    console.error("Fetch History Error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/history", authenticateToken, async (req, res) => {
  try {
    const { topic, content, suggestions, chatMessages, flashcards, quizzes } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic required" });

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const item = new History({
      userId,
      topic: topic.trim(),
      content: content || "",
      suggestions: suggestions || [],
      chatMessages: chatMessages || [],
      flashcards: flashcards || [],
      quizzes: quizzes || []
    });
    await item.save();

    res.status(201).json(item);
  } catch (err) {
    console.error("History Save Error:", err);
    res.status(500).json({ error: "Failed to save history" });
  }
});

app.put("/api/history/:id", authenticateToken, async (req, res) => {
  try {
    const { topic, content, suggestions, chatMessages, flashcards, quizzes } = req.body;
    const item = await History.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { topic, content, suggestions, chatMessages, flashcards, quizzes, timestamp: Date.now() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "History item not found" });
    res.json(item);
  } catch (err) {
    console.error("History Update Error:", err);
    res.status(500).json({ error: "Failed to update history" });
  }
});

app.delete("/api/history/:id", authenticateToken, async (req, res) => {
  try {
    await History.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ message: "History deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete history" });
  }
});

// --- LIBRARY ROUTES ---

app.get("/api/library", authenticateToken, async (req, res) => {
  try {
    const items = await LibraryItem.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch library" });
  }
});

app.post("/api/library", authenticateToken, async (req, res) => {
  try {
    const { type, title, data, category } = req.body;
    // Default category if missing (backward compatibility)
    const finalCategory = category || "General";

    const item = new LibraryItem({
      userId: req.user.userId,
      type,
      title,
      data,
      category: finalCategory
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save item" });
  }
});

app.delete("/api/library/:id", authenticateToken, async (req, res) => {
  try {
    await LibraryItem.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.put("/api/library/category", authenticateToken, async (req, res) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: "Categories required" });

    // Update all items with the old category name to the new one
    await LibraryItem.updateMany(
      { userId: req.user.userId, category: oldCategory },
      { $set: { category: newCategory } }
    );

    res.json({ message: "Category updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});


// ---------- EXISTING SOURCES ROUTE ----------
app.get("/api/sources", async (req, res) => {
  const topic = req.query.topic;
  if (!topic) {
    return res.status(400).json({ error: "topic query param is required" });
  }

  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing SERPER_API_KEY in .env" });
    }

    const body = {
      q: `${topic} tutorial documentation`,
      num: 8,
    };

    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Serper error:", txt);
      return res
        .status(502)
        .json({ error: "Failed to fetch sources from Serper.dev" });
    }

    const data = await resp.json();
    const organic = data.organic || [];

    const sources = organic.slice(0, 8).map((item) => {
      const url = item.link || "";
      const title = item.title || "Untitled";
      const snippet = item.snippet || "";
      let domain = "";

      try {
        if (url) {
          const u = new URL(url);
          domain = u.hostname.replace(/^www\./, "");
        }
      } catch {
        domain = "";
      }

      const lowerDomain = domain.toLowerCase();
      const isOfficial =
        lowerDomain.includes("wikipedia.org") ||
        lowerDomain.includes("react.dev") ||
        lowerDomain.includes("developer.mozilla.org") ||
        lowerDomain.includes("developers.google.com");

      return {
        title,
        url,
        snippet,
        domain,
        kind: isOfficial ? "official" : "tutorial",
      };
    });

    return res.json({ sources });
  } catch (err) {
    console.error("Error in /api/sources:", err);
    return res.status(500).json({ error: "Failed to load sources" });
  }
});

/**
 * PRIVATE HELPER: Scouting for direct PDF links via Serper
 */
async function findPdfLink(title, author) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    const q = `${title} Doctype:pdf`;
    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: 8 }), // Check more results for better scoring
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const organic = data.organic || [];
    
    // Scoring logic to find the MOST relevant full book
    const scoredResults = organic.map(item => {
      let score = 0;
      const lowerTitle = (item.title || "").toLowerCase();
      const lowerSnippet = (item.snippet || "").toLowerCase();
      const lowerLink = (item.link || "").toLowerCase();
      const targetTitle = title.toLowerCase();
      const targetAuthor = (author || "").toLowerCase();

      // 1. Title Overlap (High weight)
      const titleWords = targetTitle.split(/\s+/).filter(w => w.length > 3);
      const matches = titleWords.filter(w => lowerTitle.includes(w)).length;
      score += (matches / titleWords.length) * 40;

      // 2. Author Presence
      if (targetAuthor && (lowerTitle.includes(targetAuthor) || lowerSnippet.includes(targetAuthor))) {
        score += 25;
      }

      // 3. Page Count Detection (Strong indicator of full books)
      const pageMatch = lowerSnippet.match(/(\d{3,})\s*pages?/i) || lowerSnippet.match(/pp\.?\s*(\d{3,})/i);
      if (pageMatch && parseInt(pageMatch[1]) > 100) {
        score += 35;
      }

      // 4. Domain Reputation
      const docHosts = ["archive.org", "researchgate.net", "academia.edu", "krishnagudi.com", "dokumen.pub", "pdfstore.in", "github.com", ".edu", ".ac.in", ".edu.py"];
      if (docHosts.some(host => lowerLink.includes(host))) {
        score += 15;
      }

      // 5. Negative Keywords (Summaries / Cheat sheets)
      const badWords = ["cheat sheet", "summary", "preview", "sample chapter", "chapter 1", "syllabus", "notes"];
      if (badWords.some(w => lowerTitle.includes(w) || lowerSnippet.includes(w))) {
        score -= 60;
      }

      // 6. Direct PDF Link Preference
      if (lowerLink.endsWith(".pdf")) {
        score += 10;
      }

      return { link: item.link, score };
    });

    // Sort by score and filter out low-confidence results
    scoredResults.sort((a, b) => b.score - a.score);
    
    const bestMatch = scoredResults[0];
    
    // STRICT THRESHOLD: 45 means it MUST have a good title match + (Author OR Page Count OR Trusted Host)
    if (bestMatch && bestMatch.score > 45) {
      console.log(`[PDF Scout] Found high-confidence match for "${title}": ${bestMatch.link} (Score: ${bestMatch.score.toFixed(1)})`);
      return bestMatch.link;
    }

    console.log(`[PDF Scout] No high-confidence PDF for "${title}" (Best score: ${bestMatch ? bestMatch.score.toFixed(1) : 0})`);
    return null;
  } catch (err) {
    console.warn(`Enhanced PDF search failed for ${title}:`, err.message);
    return null;
  }
}

// ---------- EXISTING REFERENCE BOOKS ----------
const CURATED_BOOKS = {
  "web services": [
    { title: "RESTful Web Services", author: "Leonard Richardson", link: "https://www.google.com/search?tbm=bks&q=RESTful+Web+Services", thumbnail: "", source: "curated" },
    { title: "Building Microservices", author: "Sam Newman", link: "https://www.google.com/search?tbm=bks&q=Building+Microservices", thumbnail: "", source: "curated" }
  ],
  "react": [
    { title: "Learning React", author: "Alex Banks, Eve Porcello", link: "https://www.google.com/search?tbm=bks&q=Learning+React", thumbnail: "", source: "curated" },
    { title: "The Road to React", author: "Robin Wieruch", link: "https://www.google.com/search?tbm=bks&q=The+Road+to+React", thumbnail: "", source: "curated" }
  ],
  "javascript": [
    { title: "Eloquent JavaScript", author: "Marijn Haverbeke", link: "https://eloquentjavascript.net/", thumbnail: "", source: "curated" },
    { title: "You Don't Know JS", author: "Kyle Simpson", link: "https://github.com/getify/You-Dont-Know-JS", thumbnail: "", source: "curated" }
  ]
};

async function fetchBooksFromAI(topic) {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey) return null;
  try {
    const prompt = `Generate a list of 5 real, high-quality reference books for the topic "${topic}". 
    Return strictly a JSON array of objects with the keys: "title", "author", "link", "thumbnail", "source". 
    - "link" should be a Google Books search URL.
    - "thumbnail" can be empty.
    - "source" should be "ai-recommendation".
    No markdown formatting, raw JSON string only.`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    let books = JSON.parse(content);
    if (!Array.isArray(books)) return null;

    // SCORING: Enrich AI recommendations with direct PDF scoutings
    const enhancedBooks = await Promise.all(books.map(async (b) => {
      const directPdfUrl = await findPdfLink(b.title, b.author);
      return { ...b, directPdfUrl: directPdfUrl || null };
    }));

    return enhancedBooks;
  } catch (err) {
    console.error("AI book fallback failed:", err);
    return null;
  }
}

app.get("/api/reference-books", async (req, res) => {
  const topic = req.query.topic;
  if (!topic) {
    return res.status(400).json({ error: "topic query param is required" });
  }

  const lowerTopic = topic.toLowerCase();

  try {
    const q = encodeURIComponent(`${topic} programming`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`;

    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Google Books API failed with status ${resp.status}`);
      const aiBooks = await fetchBooksFromAI(topic);
      if (aiBooks) return res.json({ books: aiBooks, note: "AI Generated" });
      if (CURATED_BOOKS[lowerTopic]) return res.json({ books: CURATED_BOOKS[lowerTopic], note: "Curated Fallback" });
      const errorMsg = resp.status === 429 ? "Google Books API Quota Exceeded. Please try again later." : "Failed to fetch books from external API";
      return res.status(resp.status === 429 ? 429 : 502).json({ error: errorMsg });
    }

    const json = await resp.json();
    const items = json.items || [];
    if (items.length === 0) {
      const aiBooks = await fetchBooksFromAI(topic);
      if (aiBooks) return res.json({ books: aiBooks });
      
      if (CURATED_BOOKS[lowerTopic]) {
        const enriched = await Promise.all(CURATED_BOOKS[lowerTopic].map(async b => {
           const directPdfUrl = await findPdfLink(b.title, b.author);
           return { ...b, directPdfUrl: directPdfUrl || null };
        }));
        return res.json({ books: enriched });
      }
    }

    const books = await Promise.all(items.map(async (item) => {
      const info = item.volumeInfo || {};
      const title = info.title || "Untitled";
      const author = (info.authors && info.authors.join(", ")) || "Unknown author";
      
      // BACKGROUND SEARCH: Scout for a direct PDF link
      const directPdfUrl = await findPdfLink(title, author);

      return {
        title,
        author,
        link: info.infoLink || "",
        directPdfUrl: directPdfUrl || null,
        thumbnail: info.imageLinks?.thumbnail || "",
        source: "google-books",
      };
    }));

    return res.json({ books });
  } catch (err) {
    console.error("Error in /api/reference-books:", err);
    const aiBooks = await fetchBooksFromAI(topic);
    if (aiBooks) return res.json({ books: aiBooks });
    
    if (CURATED_BOOKS[lowerTopic]) {
      const enriched = await Promise.all(CURATED_BOOKS[lowerTopic].map(async b => {
         const directPdfUrl = await findPdfLink(b.title, b.author);
         return { ...b, directPdfUrl: directPdfUrl || null };
      }));
      return res.json({ books: enriched });
    }
    return res.status(500).json({ error: "Failed to load reference books" });
  }
});

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Notes API listening at http://localhost:${PORT}`);
});

// Prevent immediate exit
process.on("exit", (code) => {
  console.log(`About to exit with code: ${code}`);
});

// Keep alive
setInterval(() => { }, 1 << 30);
