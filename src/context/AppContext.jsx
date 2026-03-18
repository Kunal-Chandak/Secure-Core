/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Persisted device identifier (used as senderId for encrypted chat messages)
// Mirrors the Flutter app's "device_id" storage key.
const STORAGE_KEY = "device_id";

const SETTINGS_KEY = (key) => `securecore:setting:${key}`;
const readSetting = (key, fallback) => {
  try {
    const v = localStorage.getItem(SETTINGS_KEY(key));
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const writeSetting = (key, value) => {
  try { localStorage.setItem(SETTINGS_KEY(key), value); } catch {};
};

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

  const [settings, setSettings] = useState(() => ({
    darkMode: readSetting("dark_mode", "true") !== "false",
    textSize: readSetting("text_size", "medium"),
    messageTimestamps: readSetting("message_timestamps", "true") !== "false",
    showSenderIds: readSetting("show_sender_ids", "true") !== "false",
  }));

  const setDarkMode = (next) => {
    setSettings(prev => ({ ...prev, darkMode: next }));
    writeSetting("dark_mode", String(next));
  };

  const setTextSize = (next) => {
    setSettings(prev => ({ ...prev, textSize: next }));
    writeSetting("text_size", next);
  };

  const setMessageTimestamps = (next) => {
    setSettings(prev => ({ ...prev, messageTimestamps: next }));
    writeSetting("message_timestamps", String(next));
  };

  const setShowSenderIds = (next) => {
    setSettings(prev => ({ ...prev, showSenderIds: next }));
    writeSetting("show_sender_ids", String(next));
  };

  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const alertTimeoutRef = useRef(null);

  const hideAlert = () => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    setAlert(prev => ({ ...prev, show: false }));
  };

  const showAlert = (message, type = "error") => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    setAlert({ show: true, message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 2800);
  };

  const value = useMemo(() => ({
    clientId, room, setRoom, drop, setDrop,
    settings, setDarkMode, setTextSize, setMessageTimestamps, setShowSenderIds,
    alert, showAlert, hideAlert,
  }), [clientId, room, drop, settings, alert]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
