/**
 * Vercel Serverless Function — /api/news
 * Server-side proxy for NewsAPI.org. Because the request is server→server,
 * the free-tier "localhost only" CORS restriction is completely bypassed.
 * Works identically on local dev (via Vite proxy) and Vercel production.
 *
 * Query params accepted:
 *   q       — search keyword  (default: "health")
 *   page    — page number     (default: 1)
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.VITE_NEWS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: "error", message: "News API key not configured." });
  }

  const { q = "health", page = "1" } = req.query;

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", q);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("page", page);
  url.searchParams.set("apiKey", apiKey);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Failed to reach NewsAPI." });
  }
}
