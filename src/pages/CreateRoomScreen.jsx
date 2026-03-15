import { useState } from "react";
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
  const [roomType,   setRoomType]   = useState("1on1");
  const [timer,      setTimer]      = useState("1h");
  const [customTime, setCustomTime] = useState("");
  const [loading,    setLoading]    = useState(false);
  const { clientId, setRoom } = useAppContext();

  const timerLabel =
    timer === "10m" ? "10 minutes" :
    timer === "1h"  ? "1 hour"     :
    timer === "24h" ? "24 hours"   : "schedule";

  const handleGenerate = async () => {
    setLoading(true);
    const code = randomCode();

    const expirySeconds =
      timer === "10m" ? 10 * 60 :
      timer === "1h"  ? 60 * 60 :
      timer === "24h" ? 24 * 60 * 60 :
      parseInt(customTime, 10) > 0 ? parseInt(customTime, 10) * 60 :
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
            {TIMERS.map(t => (
              <button
                key={t.val}
                className={`timer-pill ${timer === t.val ? "active" : ""}`}
                onClick={() => setTimer(t.val)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {timer === "custom" && (
            <div style={{ marginTop: 12 }}>
              <input
                className="input-field"
                placeholder="e.g. 2 hours / 30 minutes"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
              />
            </div>
          )}
        </div>

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