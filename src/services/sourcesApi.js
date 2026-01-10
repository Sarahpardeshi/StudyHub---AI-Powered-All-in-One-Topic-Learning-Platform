// src/services/sourcesApi.js
const API_BASE = "http://localhost:5006";

export async function fetchSources(topic) {
  const url = `${API_BASE}/api/sources?topic=${encodeURIComponent(topic)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load sources");
  }

  const data = await res.json();
  return data.sources || [];
}
