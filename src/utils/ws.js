// simple websocket helper that opens a connection to the backend

// When running locally, the backend listens on port 3001 (per `.env`).
// If VITE_API_BASE_URL is not set, fall back to that.
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function connectWS() {
  // Convert http(s) -> ws(s)
  const url = BASE.replace(/^http/, "ws");
  return new WebSocket(url);
}
