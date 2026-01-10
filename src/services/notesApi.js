// src/services/notesApi.js
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;

export async function fetchTopicNotes(topic) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in .env");
  }

  const prompt = `
You are an expert tutor. Generate a structured note about "${topic}".
Use the following Markdown format exactly:

## What is ${topic}?
(A clear, concise definition)

## Extended overview
(A detailed explanation of how it works, why it matters, and key details.)

## Key concepts
- **Concept 1**: Explanation
- **Concept 2**: Explanation
(Add more as needed)

## Examples
- **Example 1**: Description
- **Example 2**: Description

## Pitfalls / misconceptions
- **Misconception**: Correction
- **Misconception**: Correction

## Where to go deeper
- List 2-3 specific sub-topics or advanced areas to study next.

---SUGGESTIONS---
Question 1
Question 2
Question 3
(Provide 3 distinct, intriguing follow-up questions the user might want to ask next about ${topic}. Just the questions, one per line.)

Answer directly in Markdown. Do not wrap in \`\`\`markdown code blocks.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for free tier
        "X-Title": "StudyHub" // Optional
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful and knowledgeable academic tutor."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", errorData);

      if (response.status === 401) {
        throw new Error("Invalid OpenRouter API Key.");
      }
      if (response.status === 402) {
        throw new Error("Insufficient credits on OpenRouter (if using paid model).");
      }
      if (response.status === 429) {
        return { content: `## ⚠️ Quota Exceeded\n\nThe AI model is currently busy or you have hit a rate limit. Please wait a moment and try again.`, suggestions: [] };
      }

      throw new Error(errorData.error?.message || `OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    let fullContent = data.choices?.[0]?.message?.content || "";

    if (!fullContent) {
      throw new Error("No content received from AI.");
    }

    // Parse suggestions
    let content = fullContent;
    let suggestions = [];

    if (fullContent.includes("---SUGGESTIONS---")) {
      const parts = fullContent.split("---SUGGESTIONS---");
      content = parts[0].trim();
      const suggestionsRaw = parts[1].trim();
      suggestions = suggestionsRaw.split("\n").filter(s => s.trim().length > 0).slice(0, 3);
    } else {
      // Fallback default suggestions if parsing fails
      suggestions = [
        `Tell me more about ${topic}`,
        `What are the applications of ${topic}?`,
        `Explain ${topic} in simple terms`
      ];
    }

    return { content, suggestions };

  } catch (error) {
    console.error("Error generating notes:", error);
    if (error.message.includes("Quota") || error.message.includes("429")) {
      return { content: `## ⚠️ Quota Exceeded\n\nPlease try again in a few moments.`, suggestions: [] };
    }
    throw error;
  }
}

export async function fetchChatResponse(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in .env");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyHub"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful academic tutor. Answer strictly the user's question. Be concise, direct, and avoid unnecessary elaboration. If asked for a definition, provide ONLY the definition."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      // Handle errors similar to above
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) return "⚠️ Quota Exceeded. Please wait a moment.";
      throw new Error(errorData.error?.message || `OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";

  } catch (error) {
    console.error("Error fetching chat response:", error);
    return "Error getting response. Please try again.";
  }
}

export async function fetchFlashcards(topic, contextNotes = null) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in .env");
  }

  let prompt = "";
  if (contextNotes) {
    prompt = `
You are an expert tutor. Generate 5 high-quality flashcards based strictly on the following notes about "${topic}":
NOTES:
"${contextNotes.substring(0, 3000)}"

Each flashcard should test a key concept mentioned in the notes.
Return the response strictly as a JSON array of objects, where each object has "question" and "answer" keys.
Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
`;
  } else {
    prompt = `
Generate 5 high-quality flashcards for the topic "${topic}".
Each flashcard should test a key concept, definition, or difference relevant to the topic.
Return the response strictly as a JSON array of objects, where each object has "question" and "answer" keys.
Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
`;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyHub"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful academic tutor. You output strictly valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) return [];
      throw new Error(errorData.error?.message || `OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";

    // Precise JSON extraction: find outer brackets
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');

    if (start !== -1 && end !== -1 && end > start) {
      content = content.substring(start, end + 1);
    } else {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    try {
      const flashcards = JSON.parse(content);
      if (Array.isArray(flashcards)) {
        return flashcards.slice(0, 10);
      }
      return [];
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", content);
      return [];
    }

  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [];
  }
}

export async function fetchFlashcardsFromChat(contextText) {
  if (!OPENROUTER_API_KEY) return [];

  const prompt = `
Based on the following explanation, generate 2-3 relevant flashcards.
Context: "${contextText.substring(0, 1500)}"
Return strictly a JSON array of objects with "question" and "answer" keys.
No markdown.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyHub"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          { role: "system", content: "You extract flashcards from text. Output strictly valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";

    // Precise JSON extraction: find outer brackets
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');

    if (start !== -1 && end !== -1 && end > start) {
      content = content.substring(start, end + 1);
    } else {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    try {
      const cards = JSON.parse(content);
      return Array.isArray(cards) ? cards : [];
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}
