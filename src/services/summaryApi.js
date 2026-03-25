// src/services/summaryApi.js
export async function fetchTopicSummary(topic) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    topic
  )}`; // [web:125]

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return data.extract || null;
  } catch (err) {
    console.error("fetchTopicSummary error:", err);
    return null;
  }
}

