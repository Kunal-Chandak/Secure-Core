/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Persisted device identifier (used as senderId for encrypted chat messages)
// Mirrors the Flutter app's "device_id" storage key.
const STORAGE_KEY = "device_id";

function genId() {
  try {
    // Prefer a proper UUID
    return uuidv4();
  } catch {
    // Fallback (should seldom be needed)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [clientId] = useState(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const id = genId();
      localStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch {
      // If localStorage is unavailable (e.g. private browsing restrictions), still provide a stable id for this session
      return genId();
    }
  });

  const [room, setRoom] = useState(null);
  const [drop, setDrop] = useState(null);

  const value = useMemo(() => ({ clientId, room, setRoom, drop, setDrop }), [clientId, room, drop]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
