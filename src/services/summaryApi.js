// src/services/summaryApi.js
export async function fetchTopicSummary(topic) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    topic
  )}`; // [web:125]

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load summary");
  }

  const data = await res.json();
  return data.extract || "";
}
