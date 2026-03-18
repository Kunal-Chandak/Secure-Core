import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { QRCode } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { burnRoom } from "../api";
import WebLayout from "../components/WebLayout";

const fmtTime = (s) => {
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
};

const RoomCreatedScreen = ({ navigate }) => {
  const { clientId, room, setRoom, showAlert } = useAppContext();
  const [copied,  setCopied]  = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!room?.roomHash) { navigate("home"); return; }
    const getExpiryMs = () => {
      if (typeof room.expiryTimestamp === "number") return room.expiryTimestamp;
      const parsed = Date.parse(room.expiryTimestamp);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };
    const update = () => {
      const remaining = Math.max(0, Math.floor((getExpiryMs() - Date.now()) / 1000));
      setSeconds(remaining);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [room, navigate]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(room?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <WebLayout navigate={navigate} currentPage="create">
      <style>{`
        .roomcreated-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 900px;
        }
        @media (min-width: 820px) {
          .roomcreated-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button className="back-btn" onClick={() => navigate("home")} style={{ marginBottom: 16 }}>
          <Icon name="home" size={16} /> HOME
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Room <span className="text-yellow">Created</span>
          </h2>
          <div className="badge green">
            <div className="pulse-dot" style={{ background: "var(--green)", boxShadow: "0 0 4px var(--green)" }} />
            ROOM ACTIVE
          </div>
        </div>
        <p className="text-grey" style={{ fontSize: 14, marginTop: 8, marginBottom: 0 }}>
          Share this code to invite others into the encrypted room
        </p>
      </div>

      <div className="roomcreated-grid">

        {/* ── LEFT: code + actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Code card */}
          <div className="card card-glow" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div className="label" style={{ justifyContent: "center", marginBottom: 16 }}>Room Access Code</div>
            <div className="code-display" style={{ justifyContent: "center", marginBottom: 20 }}>
              {(room?.code || "------").split("").map((d, i) => (
                <div key={i} className="code-digit">{d}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-icon" style={{ flex: 1, justifyContent: "center" }} onClick={handleCopy}>
                <Icon name={copied ? "check" : "copy"} size={15} color={copied ? "var(--green)" : "currentColor"} />
                {copied ? "COPIED!" : "COPY CODE"}
              </button>
              <button
                className="btn-icon"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => {
                  if (navigator.share) navigator.share({ text: room?.code || "" });
                  else showAlert("Share not supported", "warning");
                }}
              >
                <Icon name="share" size={15} /> SHARE
              </button>
            </div>
          </div>

          {/* Timer + burn */}
          <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="clock" size={18} color="var(--yellow)" />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", marginBottom: 2 }}>SELF-DESTRUCT IN</div>
                <div className={`timer-display ${seconds < 300 ? "urgent" : ""}`} style={{ fontSize: 22 }}>
                  {fmtTime(seconds)}
                </div>
              </div>
            </div>
            <button
              className="btn-icon"
              style={{ color: "var(--red)", borderColor: "rgba(255,59,59,0.3)" }}
              onClick={async () => {
                if (!room?.roomHash) return;
                if (!window.confirm("Burn this room? This will delete all messages and disconnect participants.")) return;
                try {
                  const res = await burnRoom(room.roomHash, clientId);
                  if (res.success) { setRoom(null); navigate("home"); }
                  else showAlert("Unable to burn room: " + (res.error || "unknown"), "error");
                } catch (err) { showAlert("Error burning room: " + err.message, "error"); }
              }}
            >
              <Icon name="trash" size={14} color="var(--red)" /> BURN
            </button>
          </div>

          {/* Enter room CTA */}
          <button className="btn-primary" onClick={() => navigate("chat")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="lock" size={18} color="#0B0B0B" />
              ENTER SECURE ROOM
            </span>
          </button>
        </div>

        {/* ── RIGHT: QR code ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div className="label" style={{ justifyContent: "center", marginBottom: 16 }}>QR Code</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <QRCode value={JSON.stringify({ type: "secure_room", code: room?.code || "" })} />
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)", marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
              Ask the recipient to scan this QR from the Join Room screen
            </p>
          </div>

          {/* Info panel */}
          <div style={{
            padding: "18px 20px",
            background: "rgba(245,196,0,0.04)",
            border: "1px solid rgba(245,196,0,0.15)",
            borderRadius: 12,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", letterSpacing: "1px", marginBottom: 12 }}>
              ROOM DETAILS
            </div>
            {[
              { label: "Type",       value: room?.roomType === "group" ? "Group" : "1-on-1" },
              { label: "Encryption", value: "AES-256-GCM" },
              { label: "Creator",    value: "You" },
              { label: "Server logs",value: "None retained" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)" }}>{row.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--white)" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </WebLayout>
  );
};

export default RoomCreatedScreen;