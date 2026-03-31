// ─────────────────────────────────────────────────────
//  config.js  —  loaded by every HTML page (public + admin)
//
//  HOW IT WORKS:
//  • During local development, window.PORTFOLIO_API is not set,
//    so it falls back to http://localhost:5000
//  • On Vercel, you set an environment variable VITE_API_URL
//    OR you can just edit the PRODUCTION_API line below
//    with your Render backend URL after deploying.
// ─────────────────────────────────────────────────────

const PRODUCTION_API = "https://your-portfolio-backend.onrender.com";
// ↑ Replace this with your actual Render URL after deploying the backend.
//   e.g. "https://portfolio-backend-xyz.onrender.com"

const API = (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
  ? PRODUCTION_API
  : "http://localhost:5000";

// Make it globally available
window.API_BASE = API;