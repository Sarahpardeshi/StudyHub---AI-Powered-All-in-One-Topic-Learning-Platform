// notesGemini.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5003" }));
app.use(express.json());

const PORT = process.env.NOTES_PORT || 5004; // for example
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // [web:136][web:147]

const MODEL = "gemini-2.0-flash"; // or any other text model name [web:136][web:150]

// POST /api/ai-notes  { topic: "Machine Learning" }
app.post("/api/ai-notes", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
  }

  const prompt = `
Generate clear, student-friendly notes for the topic "${topic}".
Return structured text with these sections:

1. What it is
2. Why it matters
3. Key concepts (bulleted)
4. Simple example
5. Common pitfalls or misconceptions
6. Where to go deeper

Keep it concise but concrete.`;

  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }); // [web:136][web:150]

    const text = response.response?.text?.() || "";
    if (!text.trim()) {
      return res.status(500).json({ error: "Empty response from Gemini" });
    }

    return res.json({ notes: text });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: "Failed to generate notes" });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini notes API listening at http://localhost:${PORT}`);
});
