const YT_KEYS = [
  process.env.REACT_APP_YT_API_KEY_1,
  process.env.REACT_APP_YT_API_KEY_2,
  process.env.REACT_APP_YT_API_KEY_3
].filter(Boolean); // Only use non-empty keys

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

export async function fetchYoutubeVideos(topic) {
  let lastError = null;

  // Try each key in sequence until one works or we run out
  for (let i = 0; i < YT_KEYS.length; i++) {
    const currentKey = YT_KEYS[i];
    const url = `${BASE_URL}?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(
      topic + " tutorial explained lesson"
    )}&key=${currentKey}`;

    try {
      console.log(`[YT API] Attempting fetch with key #${i + 1}`);
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        return items
          .filter((item) => item.id && item.id.videoId && item.snippet)
          .map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url,
          }));
      }

      // Handle Quota Error
      const errorData = await res.json().catch(() => ({}));
      const reason = errorData.error?.errors?.[0]?.reason || "unknown";

      if (reason === "quotaExceeded") {
        console.warn(`[YT API] Key #${i + 1} quota exceeded. Trying next key...`);
        lastError = new Error("YouTube API quota exceeded across all keys.");
        continue; // Go to next iteration/key
      }

      // If it's another error, don't necessarily retry, just throw
      throw new Error(`Failed to load YouTube videos (Status: ${res.status})`);

    } catch (err) {
      console.error(`[YT API] Error with key #${i + 1}:`, err.message);
      lastError = err;
      // If it's a network error or quota error, try next key
      if (err.message.includes("quota exceeded") || err instanceof TypeError) {
        continue;
      }
      throw err; // For other hard errors, stop
    }
  }

  // If we reach here, all keys failed
  throw lastError || new Error("All YouTube API keys failed to load videos.");
}
