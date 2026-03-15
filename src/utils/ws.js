// simple websocket helper that opens a connection to the backend

// Match the same base URL strategy used by the REST API helpers:
// - use VITE_API_BASE_URL if configured
// - in PROD, default to the deployed backend
// - in dev, default to localhost:3001 (via Vite proxy)
const DEFAULT_BACKEND = "https://secure-core-backend.onrender.com";

// When running locally, you may want to hit the deployed backend (set via .env):
// VITE_API_BASE_URL=https://secure-core-backend.onrender.com
// Otherwise, we fall back to localhost:3001 for local backend testing.
const BASE = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? DEFAULT_BACKEND : "http://localhost:3001");

export function connectWS() {
  // Convert http(s) -> ws(s)
  const url = BASE.replace(/^http/, "ws");
  return new WebSocket(url);
}
