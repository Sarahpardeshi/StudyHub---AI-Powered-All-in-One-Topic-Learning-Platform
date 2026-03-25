// src/services/notesApi.js
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY || (OPENROUTER_API_KEY?.startsWith("gsk_") ? OPENROUTER_API_KEY : null);

const PRIMARY_MODEL = "llama-3.3-70b-versatile"; // Excellent 128k long-context free model
const FALLBACK_MODEL = "llama-3.1-8b-instant"; // Much higher TPM limits on the free tier for massive file parsing
// Groq has deprecated all Llama 3.2 vision models and replaced them with Llama 4 Scout as of today
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Helper to call Groq directly
 */
async function callGroq(messages, model = PRIMARY_MODEL, temperature = 0.7) {
  if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

  // Slice the messages array to only keep the very first message (usually system logic) 
  // and the final 4 conversation blocks. This prevents historical chat bloat from exceeding limits.
  let recentMessages = messages.length > 5 
    ? [messages[0], ...messages.slice(-4)] 
    : messages;

  // Hard limit on message array payload sizes for free-tier constraints (Strictest 6k TPM ceiling)
  const safeMessages = recentMessages.map(msg => {
    if (typeof msg.content === 'string' && msg.content.length > 3000) {
       console.warn(`Truncating massive payload inside ${msg.role} message from ${msg.content.length} to 3000 chars to avoid Groq 6k rate limits`);
       return { ...msg, content: msg.content.substring(0, 3000) + "\n\n...[TRUNCATED BY STUDYHUB DUE TO GROQ 6K TPM LIMIT]" };
    }
    // Handle array content (multimodal) by mapping text parts too
    if (Array.isArray(msg.content)) {
      const safeContentArray = msg.content.map(part => {
        if (part.type === "text" && part.text.length > 3000) {
          return { ...part, text: part.text.substring(0, 3000) + "\n\n...[TRUNCATED BY STUDYHUB]" };
        }
        return part;
      });
      return { ...msg, content: safeContentArray };
    }
    return msg;
  });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: safeMessages,
      temperature, // Removed max_tokens as it artificially limits max completion and throws context errors on Groq easily
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq Error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Unified helper that handles dataset injection and Groq multimodal parsing
 */
async function callAIWithFallbacks(messages, temperature = 0.7, hasDocument = false) {
  console.log("DEBUG: GROQ_API_KEY detected:", !!GROQ_API_KEY);

  let lastError = "No attempts made";

  // Check if there are any actual images in the prompt
  const hasImage = messages.some(msg => Array.isArray(msg.content) && msg.content.some(part => part.type === "image_url"));

  // 1. If there's an image, force the Vision model
  if (hasImage) {
    console.warn("Multimodal payload detected. Forcing Groq Vision model...");
    try {
      console.warn(`Attempting Groq Vision with model: ${VISION_MODEL}...`);
      return await callGroq(messages, VISION_MODEL, temperature);
    } catch (fallbackErr) {
      console.error(`Groq Vision model ${VISION_MODEL} failed:`, fallbackErr.message);
      throw new Error(`Vision AI Failure. Please try the following:\n1. Check Groq API keys.\nLast Error: ${fallbackErr.message}`);
    }
  }

  // 2. Try Groq Primary (128k Context - excellent for datasets/PDFs and fast chat)
  try {
    if (GROQ_API_KEY) {
      console.log(`Attempting Groq primary (${PRIMARY_MODEL})... (Document attached: ${hasDocument})`);
      return await callGroq(messages, PRIMARY_MODEL, temperature);
    } else {
      console.error("DEBUG: Groq API Key is missing from browser context.");
      lastError = "Groq Key Missing (Try restarting npm start)";
    }
  } catch (err) {
    console.error(`Groq Primary (${PRIMARY_MODEL}) failed:`, err.message);
    lastError = `Groq Error: ${err.message}`;
    
    // 3. Fallback to Lighter Model (Higher TPM)
    try {
      if (GROQ_API_KEY) {
        console.warn(`Attempting Groq fallback (${FALLBACK_MODEL})...`);
        return await callGroq(messages, FALLBACK_MODEL, temperature);
      }
    } catch (fallbackErr) {
      console.error(`Groq Fallback (${FALLBACK_MODEL}) failed:`, fallbackErr.message);
      lastError = `Groq Error: ${fallbackErr.message}`;
    }
  }

  throw new Error(`AI Failure. Please try the following:\n1. Restart your terminal (npm start) to load new keys.\n2. Ensure your Groq API key is valid.\nLast Error: ${lastError}`);
}

// --- PUBLIC API FUNCTIONS ---

export async function fetchTopicNotes(topic) {
  const prompt = `
Generate a structured note about "${topic}". Use Markdown.
## What is ${topic}?
(A clear definition)
## Key concepts
## Examples
---SUGGESTIONS---
Question 1
Question 2
Question 3`;

  try {
    const content = await callAIWithFallbacks([{ role: "user", content: prompt }]);
    return parseNotesResponse(content, topic);
  } catch (error) {
    return {
      content: `## ⚠️ AI Service Unavailable\n\n${error.message}\n\nPlease check your connection or wait a few moments.`,
      suggestions: []
    };
  }
}

export async function fetchChatResponse(messages, topic = "", notes = "", hasDocument = false) {
  try {
    const systemMsg = {
      role: "system",
      content: `You are a helpful academic tutor. 
      The user is currently studying: "${topic}". 
      Use these study notes as your primary reference: "${notes}". 
      If the user asks a short or vague question (like "advantages" or "examples"), 
      always assume they are referring to this topic and context. Be concise and direct.`
    };
    return await callAIWithFallbacks([systemMsg, ...messages], 0.7, hasDocument);
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

export async function fetchFlashcards(topic, contextNotes = null) {
  const hasValidContext = contextNotes && contextNotes.trim().length > 100 && !contextNotes.includes("⚠️ AI Service Unavailable");

  const systemMsg = "You are a specialized academic educator. You focus on conceptual understanding and logical relationships. AVOID asking questions about the order of items (e.g., 'What is the third...'). Instead, ask questions that require reasoning about the 'why' and 'how' based strictly on the provided notes. You ONLY output valid JSON arrays.";

  const prompt = hasValidContext
    ? `STRICT INSTRUCTION: Generate 5 flashcards that test LOGICAL UNDERSTANDING of the following study notes. Do not ask for list orders.
    
NOTES:
"${contextNotes}"

Return strictly a JSON array: [{"question": "...", "answer": "..."}]`
    : `Generate 5 conceptual flashcards for the topic: "${topic}". 
Return strictly a JSON array: [{"question": "...", "answer": "..."}]`;

  try {
    const content = await callAIWithFallbacks([
      { role: "system", content: systemMsg },
      { role: "user", content: prompt }
    ], 0.3);

    let cards = extractJSON(content);

    if ((!cards || cards.length === 0) && hasValidContext) {
      console.warn("Context-based flashcards failed. Trying general fallback...");
      return await fetchFlashcards(topic, null);
    }

    return Array.isArray(cards) ? cards : [];
  } catch (error) {
    console.error("Flashcards failed:", error);
    return [];
  }
}

export async function fetchQuizQuestions(topic, contextNotes = null) {
  const hasValidContext = contextNotes && contextNotes.trim().length > 100 && !contextNotes.includes("⚠️ AI Service Unavailable");

  const systemMsg = "You are an expert examiner. You create multiple-choice questions that test deep conceptual understanding and application rather than rote memorization. AVOID questions about sequences or list indices. Focus on 'why' things happen and 'how' concepts relate. You ONLY output valid JSON arrays.";

  const prompt = hasValidContext
    ? `STRICT INSTRUCTION: Generate 5 Multiple Choice Questions (MCQs) that require LOGICAL REASONING based on the study notes provided below.
    
NOTES:
"${contextNotes}"

Return strictly a JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}]`
    : `Generate 5 reasoning-based MCQs for: "${topic}". 
Return strictly a JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}]`;

  try {
    const content = await callAIWithFallbacks([
      { role: "system", content: systemMsg },
      { role: "user", content: prompt }
    ], 0.6, 2000);

    const questions = extractJSON(content);
    return Array.isArray(questions) ? questions.slice(0, 5) : [];
  } catch (error) {
    console.error("Quiz failed:", error);
    return [];
  }
}

const BACKEND_URL = "http://localhost:5006/api";

export async function fetchReadingList(topic) {
  try {
    // 1. Try Backend (Official Google Books via Server)
    const resp = await fetch(`${BACKEND_URL}/reference-books?topic=${encodeURIComponent(topic)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data.books && data.books.length > 0) return data.books;
    }
  } catch (err) {
    console.error("Backend books failed, falling back to AI:", err);
  }

  // 2. Fallback to AI Generation
  const prompt = `Recommend 5 highly relevant books for studying "${topic}". 
For each book, include title, author, a very short description, and a Google Books search URL.
Return strictly a JSON array and nothing else. No conversational filler.
Format: [{"title": "...", "author": "...", "description": "...", "link": "..."}]`;

  try {
    const content = await callAIWithFallbacks([
      { role: "system", content: "You are an academic librarian who ONLY outputs valid JSON arrays. Never include markdown code blocks or explanations." },
      { role: "user", content: prompt }
    ], 0.3, 1500);

    const books = extractJSON(content);
    return Array.isArray(books) ? books.slice(0, 5) : [];
  } catch (error) {
    console.error("Reading list AI fallback failed:", error);
    return [];
  }
}

export async function fetchWebSources(topic) {
  try {
    // 1. Try Backend (Serper.dev via Server)
    const resp = await fetch(`${BACKEND_URL}/sources?topic=${encodeURIComponent(topic)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data.sources && data.sources.length > 0) {
        // Map backend format to frontend format if necessary
        return data.sources.map(s => ({
          name: s.title || s.name,
          url: s.url
        }));
      }
    }
  } catch (err) {
    console.error("Backend sources failed, falling back to AI:", err);
  }

  // 2. Fallback to AI Generation
  const prompt = `Find 5 authoritative web resources or websites for learning about "${topic}".
For each source, include name and URL.
Return strictly a JSON array and nothing else. No conversational filler.
Format: [{"name": "...", "url": "..."}]`;

  try {
    const content = await callAIWithFallbacks([
      { role: "system", content: "You are a research assistant who ONLY outputs valid JSON arrays. Never include markdown code blocks or explanations." },
      { role: "user", content: prompt }
    ], 0.3, 1000);

    const sources = extractJSON(content);
    return Array.isArray(sources) ? sources.slice(0, 5) : [];
  } catch (error) {
    console.error("Web sources AI fallback failed:", error);
    return [];
  }
}

// --- HELPERS ---

function parseNotesResponse(fullContent, topic) {
  let content = fullContent;
  let suggestions = [];

  if (fullContent.includes("---SUGGESTIONS---")) {
    const parts = fullContent.split("---SUGGESTIONS---");
    content = parts[0].trim();
    suggestions = parts[1].trim().split("\n").filter(s => s.trim().length > 0).slice(0, 3);
  } else {
    suggestions = [`Tell me more about ${topic}`, `Applications of ${topic}`, `Simple explanation`];
  }
  return { content, suggestions };
}

function extractJSON(content) {
  if (!content || typeof content !== 'string') return [];

  let cleaned = content.trim();

  // 1. Remove Markdown code blocks first
  cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();

  // 2. Find the boundaries of the JSON array or object
  const jsonStartBoundaries = [cleaned.indexOf('['), cleaned.indexOf('{')].filter(i => i !== -1);
  const start = jsonStartBoundaries.length > 0 ? Math.min(...jsonStartBoundaries) : -1;

  const jsonEndBoundaries = [cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}')].filter(i => i !== -1);
  const end = jsonEndBoundaries.length > 0 ? Math.max(...jsonEndBoundaries) : -1;

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    // If it's an object with a key that is an array, return that array (AI often wraps in {"flashcards": [...]})
    if (!Array.isArray(parsed) && typeof parsed === 'object') {
      for (const key in parsed) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // 3. Last ditch effort: try to find anything that looks like an array in the string
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerE) {
        console.error("Deep JSON parsing failed:", innerE);
      }
    }
    console.error("JSON Extraction failed. Raw content was:", content);
    return [];
  }
}
