const API_KEY = process.env.REACT_APP_YT_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

console.log("API_KEY in youtubeApi:", API_KEY);

export async function fetchYoutubeVideos(topic) {
  const url = `${BASE_URL}?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(
    topic + " tutorial explained lesson"
  )}&key=${API_KEY}`;

  console.log("YT request URL:", url);
  const res = await fetch(url);
  console.log("YT status:", res.status);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const reason = errorData.error?.errors?.[0]?.reason || "unknown";
    console.error("YT error details:", errorData);

    if (reason === "quotaExceeded") {
      throw new Error("YouTube API quota exceeded. Please try again later.");
    }
    throw new Error(`Failed to load YouTube videos (Status: ${res.status})`);
  }

  const data = await res.json();
  console.log("YT data items:", data.items);

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
