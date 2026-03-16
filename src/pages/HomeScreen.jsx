import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "../components/Icon";
import { LogoMark, DeviceId } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { loadRecentRooms } from "../utils/recentRooms";
import { getRoomInfo } from "../api";

const Toast = ({ message, show }) => {
  if (typeof document === "undefined") return null;

  const toast = (
    <div style={{
      position: "fixed",
      bottom: "calc(24px + 68px)",
      left: "50%",
      transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
      opacity: show ? 1 : 0,
      transition: "all 0.3s ease",
      background: "rgba(255,59,59,0.9)",
      color: "#fff",
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      letterSpacing: "0.5px",
      padding: "10px 20px",
      borderRadius: 10,
      zIndex: 9999,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      {message}
    </div>
  );

  return createPortal(toast, document.body);
};

const HomeScreen = ({ navigate }) => {
  const { clientId } = useAppContext();
  const [time, setTime] = useState(new Date());
  const [recentRooms, setRecentRooms] = useState(() => loadRecentRooms());
  const initialRoomsRef = useRef(recentRooms);
  const [toast, setToast] = useState({ show: false, msg: "" });

  const shortenId = (id) => {
    if (!id) return "";
    if (id.length < 8) return id;
    return `${id.slice(0, 3)}-${id.slice(id.length - 6, id.length - 4)}-${id.slice(id.length - 2)}`;
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const then = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const gotoRecentRoom = (room) => {
    if (!room?.code) return;
    const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
    const isExpired = expiryMs ? Date.now() >= expiryMs : false;
    const isAlive   = room.exists !== false;
    if (isExpired || !isAlive) return;

    localStorage.setItem("securecore:prefill_code", room.code);
    navigate("join");
  };

  const RecentRoomCard = ({ room }) => {
    const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
    const isExpired = expiryMs ? Date.now() >= expiryMs : false;
    const isAlive   = room.exists !== false;
    const isActive  = !isExpired && isAlive;

    return (
      <div
        onClick={() => gotoRecentRoom(room)}
        className="card"
        style={{
          padding: "20px 16px",
          textAlign: "left",
          cursor: isActive ? "pointer" : "default",
          borderColor: isActive ? "rgba(245,196,0,0.3)" : "rgba(255,59,59,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44,
              height: 44,
              background: isActive ? "rgba(245,196,0,0.15)" : "rgba(255,59,59,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon name={isActive ? "history" : "lockClock"} size={22} color={isActive ? "var(--yellow)" : "var(--red)"} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--white)" }}>
                Room #{room.code}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)", marginTop: 2 }}>
                {getTimeAgo(room.joinedAt)}
              </div>
            </div>
          </div>
          <div style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: isActive ? "rgba(245,196,0,0.15)" : "rgba(255,59,59,0.15)",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: isActive ? "var(--yellow)" : "var(--red)",
            }}>
              {isActive ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const copyDeviceId = () => {
    if (!clientId) return;
    navigator.clipboard?.writeText(clientId).then(() => {
      setToast({ show: true, msg: "Device ID copied" });
      setTimeout(() => setToast({ show: false, msg: "" }), 2500);
    }).catch(() => {
      setToast({ show: true, msg: "Copy failed" });
      setTimeout(() => setToast({ show: false, msg: "" }), 2500);
    });
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Check whether each room still exists; if not, mark it expired.
    initialRoomsRef.current.forEach((room) => {
      const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
      if (expiryMs && Date.now() >= expiryMs) return; // already expired

      getRoomInfo(room.roomHash)
        .then(res => {
          if (!res.success) throw new Error("not found");
          // still exists; nothing to do
        })
        .catch(() => {
          setRecentRooms(prev => prev.map(r => r.roomHash === room.roomHash ? { ...r, exists: false } : r));
        });
    });
  }, []);

  const actions = [
    { icon: "plus",     label: "Create Secret Room", desc: "End-to-end encrypted room",    page: "create",   accent: true },
    { icon: "lock",     label: "Join Secret Room",   desc: "6-digit code or QR scan",      page: "join" },
    { icon: "upload",   label: "Secure File Drop",   desc: "One-time encrypted transfer",  page: "filedrop" },
    { icon: "download", label: "Receive Files",      desc: "Retrieve your secure file",    page: "receive" },
  ];

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <LogoMark />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div className="status-row">
              <div className="pulse-dot" />
              <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 11 }}>ONLINE</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)" }}>
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", letterSpacing: "2px", marginBottom: 10 }}>
            // PROTOCOL v2.1 ACTIVE
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Zero-Trust<br />
            <span style={{ color: "var(--yellow)" }}>Encrypted</span><br />
            Communication
          </h1>
          <p style={{ color: "var(--grey)", fontSize: 14, marginTop: 12, lineHeight: 1.6, maxWidth: 320 }}>
            Military-grade AES-256 encryption. Ephemeral rooms. No logs, no traces.
          </p>
        </div>

        {/* Status panel */}
        <div className="card card-glow" style={{ padding: "14px 18px", marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div className="status-row">
            <Icon name="shield" size={15} color="var(--green)" />
            <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.5px" }}>AES-256 ACTIVE</span>
          </div>
          <div style={{ width: 1, height: 24, background: "var(--border)" }} />
          <button
            onClick={copyDeviceId}
            title={clientId ? "Copy device ID" : ""}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: clientId ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <DeviceId id={clientId ? shortenId(clientId) : ""} iconSize={20} textSize={13} />
          </button>
        </div>
      </div>

      {/* ── Action Cards ── */}
      <div style={{ width: "100%", maxWidth: 480, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {actions.map((a) => (
          <button
            key={a.page}
            onClick={() => navigate(a.page)}
            style={{
              background: a.accent
                ? "linear-gradient(135deg, rgba(245,196,0,0.15) 0%, rgba(245,196,0,0.05) 100%)"
                : "var(--card)",
              border: `1px solid ${a.accent ? "rgba(245,196,0,0.35)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              padding: "20px 18px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(245,196,0,0.2), 0 12px 32px rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(245,196,0,0.5)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = a.accent ? "rgba(245,196,0,0.35)" : "var(--border)";
            }}
          >
            <div style={{
              width: 40, height: 40,
              background: a.accent ? "var(--yellow)" : "var(--card2)",
              border: `1px solid ${a.accent ? "var(--yellow)" : "var(--border)"}`,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14,
              boxShadow: a.accent ? "0 0 16px var(--yellow-glow)" : "none",
            }}>
              <Icon name={a.icon} size={18} color={a.accent ? "#0B0B0B" : "var(--yellow)"} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 5, color: "var(--white)" }}>
              {a.label}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)", lineHeight: 1.4 }}>
              {a.desc}
            </div>
            {a.accent && (
              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <div className="badge" style={{ fontSize: 10, padding: "2px 8px" }}>POPULAR</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Recent Activities ── */}
      <div style={{ width: "100%", maxWidth: 480, marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", letterSpacing: "1.5px", fontWeight: 700 }}>
            RECENT ACTIVITIES
          </div>
          {recentRooms.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem("recent_rooms");
                setRecentRooms([]);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--grey)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              CLEAR
            </button>
          )}
        </div>

        {recentRooms.length === 0 ? (
          <div
            style={{
              width: "100%",
              padding: "24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Icon name="history" size={18} color="var(--grey)" />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--grey)" }}>
                No recent rooms yet
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)" }}>
              Create or join a room to see it here.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentRooms.map((room) => (
              <RecentRoomCard key={room.roomHash} room={room} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ width: "100%", maxWidth: 480, marginTop: 24, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <Icon name="alert" size={13} color="var(--grey-dim)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)", letterSpacing: "0.3px" }}>
          All communications are end-to-end encrypted and ephemeral
        </span>
      </div>

      <Toast message={toast.msg} show={toast.show} />
    </div>
  );
};

export default HomeScreen;