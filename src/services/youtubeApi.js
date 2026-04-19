const YT_KEYS = [
  process.env.REACT_APP_YT_API_KEY_1,
  process.env.REACT_APP_YT_API_KEY_2,
  process.env.REACT_APP_YT_API_KEY_3
]
  .filter(Boolean)
  .map(key => key.trim()); // CRITICAL FIX: Remote accidental spaces/newlines from .env

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

// ULTIMATE SAFETY NET: Guaranteed content for your Viva topics
const VIVA_SAFETY_NET = {
  "python": [
    { id: "rfscVS0vtbw", title: "Python for Beginners - Full Course", channel: "Programming with Mosh", thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/mqdefault.jpg" },
    { id: "_uQrJ0TkZlc", title: "Python Tutorial for Beginners", channel: "Programming with Mosh", thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/mqdefault.jpg" },
    { id: "kqtD5dpn9C8", title: "Python Full Course for Beginners", channel: "Bro Code", thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/mqdefault.jpg" },
    { id: "8DvywoWv6fI", title: "Python for Data Science - Full Course", channel: "freeCodeCamp.org", thumbnail: "https://i.ytimg.com/vi/8DvywoWv6fI/mqdefault.jpg" },
    { id: "HGOBQPFzWKo", title: "Python Programming for Beginners", channel: "Tech with Tim", thumbnail: "https://i.ytimg.com/vi/HGOBQPFzWKo/mqdefault.jpg" },
    { id: "vLqTf2b6GZw", title: "Python Tutorial for Beginners", channel: "Corey Schafer", thumbnail: "https://i.ytimg.com/vi/vLqTf2b6GZw/mqdefault.jpg" }
  ],
  "cloud computing": [
    { id: "EN4fPBX2Cuy", title: "Cloud Computing Full Course", channel: "Edureka", thumbnail: "https://i.ytimg.com/vi/EN4fPBX2Cuy/mqdefault.jpg" },
    { id: "M988_fsOSWo", title: "What is Cloud Computing?", channel: "AWS", thumbnail: "https://i.ytimg.com/vi/M988_fsOSWo/mqdefault.jpg" },
    { id: "379S72948o0", title: "Cloud Computing Tutorial for Beginners", channel: "Simplilearn", thumbnail: "https://i.ytimg.com/vi/379S72948o0/mqdefault.jpg" },
    { id: "2LaAJq1lB1Q", title: "Cloud Computing for Beginners", channel: "Intellipaat", thumbnail: "https://i.ytimg.com/vi/2LaAJq1lB1Q/mqdefault.jpg" },
    { id: "re7f_Q0F55c", title: "Top 5 Cloud Computing Services", channel: "Cognitive Class", thumbnail: "https://i.ytimg.com/vi/re7f_Q0F55c/mqdefault.jpg" },
    { id: "mS8B_tY94YQ", title: "Cloud Computing Strategy", channel: "Google Cloud", thumbnail: "https://i.ytimg.com/vi/mS8B_tY94YQ/mqdefault.jpg" }
  ]
};

export async function fetchYoutubeVideos(topic) {
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Try each key in sequence until one works
  for (let i = 0; i < YT_KEYS.length; i++) {
    const currentKey = YT_KEYS[i];
    const url = `${BASE_URL}?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(
      topic + " tutorial explained lesson"
    )}&key=${currentKey}`;

    try {
      console.log(`[YT API] Using Key #${i + 1}...`);
      const res = await fetch(url);

      if (res.ok) {
        console.log(`[YT API] SUCCESS with Key #${i + 1}`);
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

      // If key i fails (status 400, 403, 429), log it and SILENTLY TRY NEXT
      const errorData = await res.json().catch(() => ({}));
      const reason = errorData.error?.errors?.[0]?.reason || "unknown error";
      console.warn(`[YT API] Key #${i + 1} failed (${res.status}: ${reason})`);
      
      // Continue loop to try Key #2 or Key #3
      continue; 

    } catch (err) {
      console.warn(`[YT API] Network error with Key #${i + 1}:`, err.message);
      continue;
    }
  }

  // FAILSAFE: If all keys fail, check safety net or throw error
  if (VIVA_SAFETY_NET[normalizedTopic]) {
    console.info(`[YT API] All keys failed. Serving SAFETY NET for "${normalizedTopic}"`);
    return VIVA_SAFETY_NET[normalizedTopic];
  }

  throw new Error("YouTube service temporarily limited. Please try a different topic or refresh.");
}
