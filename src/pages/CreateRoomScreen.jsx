import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { TerminalLoader, SecurityNotice } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { createRoom } from "../api";
import { generateRoomFields, randomCode } from "../utils/crypto";
import { addRecentRoom } from "../utils/recentRooms";

const TIMERS = [
  { val: "10m", label: "10 MIN" },
  { val: "1h",  label: "1 HOUR" },
  { val: "24h", label: "24 HRS" },
  { val: "custom", label: "CUSTOM" },
];

const TERMINAL_LINES = [
  "Initializing secure channel...",
  "Generating AES-256 key pair...",
  "Creating ephemeral room hash...",
  "Encrypting room metadata...",
  "Room created successfully ✓",
];

const CreateRoomScreen = ({ navigate }) => {
  const [roomType, setRoomType] = useState("1on1");
  const [timer, setTimer] = useState("1h");
  const [customMinutes, setCustomMinutes] = useState(60);
  const [showCustomTimerDialog, setShowCustomTimerDialog] = useState(false);
  const [dialogDays, setDialogDays] = useState(0);
  const [dialogHours, setDialogHours] = useState(1);
  const [dialogMinutes, setDialogMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const { clientId, setRoom } = useAppContext();

  const formatDuration = (minutes) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);

    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  const timerLabel =
    timer === "10m" ? "10 minutes" :
    timer === "1h" ? "1 hour" :
    timer === "24h" ? "24 hours" :
    timer === "custom" ? formatDuration(customMinutes) :
    "schedule";

  useEffect(() => {
    if (!showCustomTimerDialog) return;

    const totalMinutes = customMinutes || 0;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    setDialogDays(days);
    setDialogHours(hours);
    setDialogMinutes(minutes);
  }, [showCustomTimerDialog, customMinutes]);

  const handleGenerate = async () => {
    setLoading(true);
    const code = randomCode();

    const expirySeconds =
      timer === "10m" ? 10 * 60 :
      timer === "1h"  ? 60 * 60 :
      timer === "24h" ? 24 * 60 * 60 :
      timer === "custom" && customMinutes > 0 ? customMinutes * 60 :
      10 * 60;

    try {
      const payload = await generateRoomFields({
        code,
        isGroup: roomType === "group",
        expirySeconds,
        creatorId: clientId,
      });

      const res = await createRoom(payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to create room");
      }

      setRoom({
        code,
        roomHash: res.room_hash,
        roomSalt: res.room_salt,
        expiryTimestamp: Date.now() + (res.expiry || expirySeconds) * 1000,
        roomType,
        creatorId: clientId,
      });
      addRecentRoom({ code, roomHash: res.room_hash, expiryTimestamp: Date.now() + (res.expiry || expirySeconds) * 1000 });

      navigate("roomcreated");
    } catch (err) {
      console.error("Create room failed", err);
      alert(`Failed to create room: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Nav */}
        <div className="nav-header">
          <button className="back-btn" onClick={() => navigate("home")}>
            <Icon name="arrowLeft" size={16} color="currentColor" /> BACK
          </button>
          <div className="badge">
            <Icon name="lock" size={10} color="var(--yellow)" /> E2E ENCRYPTED
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 6 }}>
          Create <span className="text-yellow">Secret Room</span>
        </h2>
        <p className="text-grey" style={{ fontSize: 14, marginBottom: 28 }}>
          Configure your encrypted communication channel
        </p>

        {/* ── Room type toggle ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="label">Room Type</div>
          <div className="toggle-group">
            {[
              { val: "1on1",  icon: "lock",  label: "1-on-1" },
              { val: "group", icon: "users", label: "Group"  },
            ].map(opt => (
              <button
                key={opt.val}
                className={`toggle-option ${roomType === opt.val ? "active" : ""}`}
                onClick={() => setRoomType(opt.val)}
              >
                <Icon
                  name={opt.icon}
                  size={14}
                  color={roomType === opt.val ? "#0B0B0B" : "var(--grey)"}
                  style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Timer pills ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="label">Self-Destruct Timer</div>
          <div style={{ display: "flex", gap: 8 }}>
            {TIMERS.map(t => {
              const label = t.val === "custom" && timer === "custom"
                ? formatDuration(customMinutes)
                : t.label;

              return (
                <button
                  key={t.val}
                  className={`timer-pill ${timer === t.val ? "active" : ""}`}
                  onClick={() => {
                    if (t.val === "custom") {
                      setShowCustomTimerDialog(true);
                      setTimer("custom");
                    } else {
                      setTimer(t.val);
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {showCustomTimerDialog && (() => {
          const totalMinutes = dialogDays * 1440 + dialogHours * 60 + dialogMinutes;
          const totalSeconds = totalMinutes * 60;
          const isValid = totalSeconds >= 60 && totalSeconds <= 432000;

          return (
            <div style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              zIndex: 9999,
              padding: 20,
            }}>
              <div style={{
                width: "100%",
                maxWidth: 480,
                background: "#0B0B0B",
                borderRadius: 16,
                border: "1px solid rgba(245,196,0,0.3)",
                padding: 18,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--yellow)" }}>
                    Custom Timer
                  </div>
                  <button
                    onClick={() => setShowCustomTimerDialog(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--grey)",
                      fontSize: 18,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Days", value: dialogDays, setValue: setDialogDays, max: 5 },
                    { label: "Hours", value: dialogHours, setValue: setDialogHours, max: 23 },
                    { label: "Minutes", value: dialogMinutes, setValue: setDialogMinutes, max: 59 },
                  ].map(({ label, value, setValue, max }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 8 }}>{label}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <button
                          onClick={() => setValue(Math.max(0, value - 1))}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "transparent",
                            color: "var(--grey)",
                            cursor: value > 0 ? "pointer" : "not-allowed",
                          }}
                          disabled={value <= 0}
                        >
                          −
                        </button>
                        <div style={{ minWidth: 34, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--white)" }}>
                          {value}
                        </div>
                        <button
                          onClick={() => setValue(Math.min(max, value + 1))}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "transparent",
                            color: "var(--grey)",
                            cursor: value < max ? "pointer" : "not-allowed",
                          }}
                          disabled={value >= max}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: isValid ? "var(--yellow)" : "var(--red)" }}>
                  {isValid ? `Total: ${formatDuration(totalMinutes)}` : "Duration must be 1 min - 5 days"}
                </div>

                <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCustomTimerDialog(false)}
                    style={{ minWidth: 96 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    disabled={!isValid}
                    onClick={() => {
                      if (!isValid) return;
                      setCustomMinutes(totalMinutes);
                      setTimer("custom");
                      setShowCustomTimerDialog(false);
                    }}
                    style={{ minWidth: 96 }}
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Security notice ── */}
        <SecurityNotice text={`This room uses AES-256-GCM encryption. Messages and files are encrypted client-side before transmission. Room auto-deletes in ${timerLabel}. No server-side logs are retained.`} />

        {/* ── Terminal loader ── */}
        {loading && (
          <div style={{ marginTop: 20 }}>
            <TerminalLoader lines={TERMINAL_LINES} visible={loading} />
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#0B0B0B" }} />
                GENERATING SECURE CODE
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="shield" size={18} color="#0B0B0B" />
                GENERATE SECURE CODE
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateRoomScreen;