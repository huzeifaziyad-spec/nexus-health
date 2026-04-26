import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const newsApiKey = env.VITE_NEWS_API_KEY ?? "";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      /**
       * Dev proxy — mirrors the Vercel serverless function for local development.
       * Intercepts /api/news?q=...&page=... and forwards it to NewsAPI.org
       * with the API key injected server-side (never exposed to the browser).
       */
      proxy: {
        "/api/news": {
          target: "https://newsapi.org",
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (_proxyReq, req, _res) => {
              const qs = new URL(req.url ?? "", "http://localhost").searchParams;
              const q    = qs.get("q")    ?? "health";
              const page = qs.get("page") ?? "1";

              const dest = new URLSearchParams({
                q,
                language: "en",
                sortBy:   "publishedAt",
                pageSize: "20",
                page,
                apiKey:   newsApiKey,
              });

              _proxyReq.path = `/v2/everything?${dest.toString()}`;
            });
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
