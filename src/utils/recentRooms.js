const STORAGE_KEY = "recent_rooms";

export function loadRecentRooms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveRecentRooms(rooms) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // ignore
  }
}

export function addRecentRoom({ code, roomHash, expiryTimestamp }) {
  if (!code || !roomHash) return;
  try {
    const now = new Date().toISOString();
    const existing = loadRecentRooms();
    const filtered = existing.filter(r => r.roomHash !== roomHash);
    const next = [{ code, roomHash, joinedAt: now, expiryTimestamp }, ...filtered];
    saveRecentRooms(next.slice(0, 20));
  } catch {
    // ignore
  }
}
