import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { QRCode } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { burnRoom } from "../api";

const fmtTime = (s) => {
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
};

const RoomCreatedScreen = ({ navigate }) => {
  const { clientId, room, setRoom } = useAppContext();
  const [copied,  setCopied]  = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!room?.roomHash) {
      navigate("home");
      return;
    }

    const getExpiryMs = () => {
      if (typeof room.expiryTimestamp === "number") return room.expiryTimestamp;
      const parsed = Date.parse(room.expiryTimestamp);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };

    const update = () => {
      const expiryMs = getExpiryMs();
      const remaining = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
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
    <div className="page">
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Nav */}
        <div className="nav-header">
          <button className="back-btn" onClick={() => navigate("home")}>
            <Icon name="home" size={16} /> HOME
          </button>
          <div className="badge green">
            <div className="pulse-dot" style={{ background: "var(--green)", boxShadow: "0 0 4px var(--green)" }} />
            ROOM ACTIVE
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Room <span className="text-yellow">Created</span>
          </h2>
          <p className="text-grey" style={{ fontSize: 14 }}>Share this code to invite others</p>
        </div>

        {/* ── Code card ── */}
        <div className="card card-glow" style={{ padding: "28px 20px", marginBottom: 20, textAlign: "center" }}>
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
                if (navigator.share) {
                  navigator.share({ text: room?.code || "" });
                } else {
                  alert("Share not supported");
                }
              }}
            >
              <Icon name="share" size={15} />
              SHARE
            </button>
          </div>
        </div>

        {/* ── QR card ── */}
        <div className="card" style={{ padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
          <div className="label" style={{ justifyContent: "center", marginBottom: 16 }}>QR Code</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QRCode value={room?.code || ""} />
          </div>
        </div>

        {/* ── Timer + burn ── */}
        <div className="card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              const ok = window.confirm("Burn this room? This will delete all messages and disconnect participants.");
              if (!ok) return;
              try {
                const res = await burnRoom(room.roomHash, clientId);
                if (res.success) {
                  setRoom(null);
                  navigate("home");
                } else {
                  alert("Unable to burn room: " + (res.error || "unknown"));
                }
              } catch (err) {
                console.error(err);
                alert("Error burning room: " + err.message);
              }
            }}
          >
            <Icon name="trash" size={14} color="var(--red)" />
            BURN
          </button>
        </div>

        <button className="btn-primary" onClick={() => navigate("chat")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="lock" size={18} color="#0B0B0B" />
            ENTER SECURE ROOM
          </span>
        </button>

      </div>
    </div>
  );
};

export default RoomCreatedScreen;
