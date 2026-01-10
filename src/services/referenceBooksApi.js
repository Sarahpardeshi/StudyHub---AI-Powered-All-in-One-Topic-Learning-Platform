// src/services/referenceBooksApi.js
const API_BASE = "http://localhost:5006";

export async function fetchReferenceBooks(topic) {
  const url = `${API_BASE}/api/reference-books?topic=${encodeURIComponent(
    topic
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load reference books");
  }

  const data = await res.json();
  return data.books || [];
}
