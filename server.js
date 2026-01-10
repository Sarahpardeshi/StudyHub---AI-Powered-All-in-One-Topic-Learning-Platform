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

import { User } from "./src/models/User.js";
import { History } from "./src/models/History.js";
import { LibraryItem } from "./src/models/LibraryItem.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_dev";
const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // { userId: ... }
    next();
  });
};

// --- AUTH ROUTES ---

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
    const history = await History.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/history", authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic required" });

    // Optional: Avoid duplicates for same topic recently?
    // For now, just save every search
    const item = new History({ userId: req.user.userId, topic });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to save history" });
  }
});

app.put("/api/history/:id", authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body;
    await History.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { topic },
      { new: true }
    );
    res.json({ message: "History updated" });
  } catch (err) {
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

// ---------- EXISTING REFERENCE BOOKS ----------
app.get("/api/reference-books", async (req, res) => {
  const topic = req.query.topic;
  if (!topic) {
    return res.status(400).json({ error: "topic query param is required" });
  }

  try {
    const q = encodeURIComponent(`${topic} programming`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`;

    const resp = await fetch(url);
    if (!resp.ok) {
      return res
        .status(502)
        .json({ error: "Failed to fetch books from external API" });
    }

    const json = await resp.json();
    const items = json.items || [];

    const books = items.map((item) => {
      const info = item.volumeInfo || {};
      return {
        title: info.title || "Untitled",
        author: (info.authors && info.authors.join(", ")) || "Unknown author",
        link: info.infoLink || "",
        thumbnail: info.imageLinks?.thumbnail || "",
        source: "google-books",
      };
    });

    return res.json({ books });
  } catch (err) {
    console.error("Error in /api/reference-books:", err);
    return res
      .status(500)
      .json({ error: "Failed to load reference books" });
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
