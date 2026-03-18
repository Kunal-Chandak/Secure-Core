import { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon";
import { DeviceId } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { loadRecentRooms } from "../utils/recentRooms";
import { getRoomInfo, preWarmServer } from "../api";
import WebLayout from "../components/WebLayout";

const HomeScreen = ({ navigate }) => {
  const { clientId, showAlert } = useAppContext();
  const [time, setTime] = useState(new Date());
  const [recentRooms, setRecentRooms] = useState(() => loadRecentRooms());
  const initialRoomsRef = useRef(recentRooms);

  const shortenId = (id) => {
    if (!id) return "";
    if (id.length < 8) return id;
    return `${id.slice(0, 3)}-${id.slice(id.length - 6, id.length - 4)}-${id.slice(id.length - 2)}`;
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const diff = Date.now() - new Date(timestamp).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
  };

  const gotoRecentRoom = (room) => {
    if (!room?.code) return;
    const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
    if ((expiryMs && Date.now() >= expiryMs) || room.exists === false) return;
    localStorage.setItem("securecore:prefill_code", room.code);
    navigate("join");
  };

  const RecentRoomCard = ({ room }) => {
    const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
    const isExpired = expiryMs ? Date.now() >= expiryMs : false;
    const isActive  = !isExpired && room.exists !== false;
    return (
      <div
        onClick={() => gotoRecentRoom(room)}
        className="card"
        style={{
          padding: "14px 16px", cursor: isActive ? "pointer" : "default",
          borderColor: isActive ? "rgba(245,196,0,0.3)" : "rgba(255,59,59,0.3)",
          transition: "all 0.18s ease",
        }}
        onMouseEnter={e => isActive && (e.currentTarget.style.borderColor = "rgba(245,196,0,0.55)")}
        onMouseLeave={e => isActive && (e.currentTarget.style.borderColor = "rgba(245,196,0,0.3)")}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: isActive ? "rgba(245,196,0,0.12)" : "rgba(255,59,59,0.12)",
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={isActive ? "history" : "lockClock"} size={18} color={isActive ? "var(--yellow)" : "var(--red)"} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--white)" }}>
                Room #{room.code}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--grey)", marginTop: 2 }}>
                {getTimeAgo(room.joinedAt)}
              </div>
            </div>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            color: isActive ? "var(--yellow)" : "var(--red)",
            background: isActive ? "rgba(245,196,0,0.1)" : "rgba(255,59,59,0.1)",
            padding: "4px 8px", borderRadius: 6,
          }}>
            {isActive ? "ACTIVE" : "EXPIRED"}
          </span>
        </div>
      </div>
    );
  };

  const copyDeviceId = () => {
    if (!clientId) return;
    navigator.clipboard?.writeText(clientId)
      .then(() => { showAlert("Device ID copied", "success"); })
      .catch(() => { showAlert("Copy failed", "error"); });
  };

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { preWarmServer().catch(() => {}); }, []);
  useEffect(() => {
    initialRoomsRef.current.forEach((room) => {
      const expiryMs = room?.expiryTimestamp ? new Date(room.expiryTimestamp).getTime() : null;
      if (expiryMs && Date.now() >= expiryMs) return;
      getRoomInfo(room.roomHash)
        .then(res => { if (!res.success) throw new Error("not found"); })
        .catch(() => setRecentRooms(prev => prev.map(r => r.roomHash === room.roomHash ? { ...r, exists: false } : r)));
    });
  }, []);

  const actions = [
    { icon: "plus",     label: "Create Secret Room", desc: "End-to-end encrypted room",    page: "create",   accent: true },
    { icon: "lock",     label: "Join Secret Room",   desc: "6-digit code or QR scan",      page: "join" },
    { icon: "upload",   label: "Secure File Drop",   desc: "One-time encrypted transfer",  page: "filedrop" },
    { icon: "download", label: "Receive Files",      desc: "Retrieve your secure file",    page: "receive" },
  ];

  return (
    <WebLayout navigate={navigate} currentPage="home">
      <style>{`
        .home-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          width: 100%;
        }
        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 1100px) {
          .home-grid {
            grid-template-columns: 1fr 340px;
            gap: 40px;
            align-items: start;
          }
        }
        @media (max-width: 480px) {
          .action-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", letterSpacing: "2px", marginBottom: 6 }}>
            // PROTOCOL v2.1 ACTIVE
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px", margin: 0 }}>
            Zero-Trust <span style={{ color: "var(--yellow)" }}>Encrypted</span> Communication
          </h1>
          <p style={{ color: "var(--grey)", fontSize: 14, marginTop: 10, marginBottom: 0, lineHeight: 1.6, maxWidth: 480 }}>
            Military-grade AES-256 encryption. Ephemeral rooms. No logs, no traces.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, paddingTop: 4 }}>
          <div className="status-row">
            <div className="pulse-dot" />
            <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 11 }}>ONLINE</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)" }}>
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </span>
        </div>
      </div>

      <div className="home-grid">

        {/* ── LEFT COLUMN: status + action cards ── */}
        <div>
          {/* Status bar */}
          <div className="card card-glow" style={{
            padding: "14px 18px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
          }}>
            <div className="status-row">
              <Icon name="shield" size={15} color="var(--green)" />
              <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.5px" }}>AES-256 ACTIVE</span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--border)" }} />
            <button
              onClick={copyDeviceId}
              title={clientId ? "Copy device ID" : ""}
              style={{ border: "none", background: "transparent", padding: 0, cursor: clientId ? "pointer" : "default", display: "flex", alignItems: "center", gap: 8 }}
            >
              <DeviceId id={clientId ? shortenId(clientId) : ""} iconSize={20} textSize={13} />
            </button>
          </div>

          {/* Action cards */}
          <div className="action-grid">
            {actions.map((a) => (
              <button
                key={a.page}
                onClick={() => navigate(a.page)}
                style={{
                  background: a.accent
                    ? "linear-gradient(135deg, rgba(245,196,0,0.15) 0%, rgba(245,196,0,0.05) 100%)"
                    : "var(--card)",
                  border: `1px solid ${a.accent ? "rgba(245,196,0,0.35)" : "var(--border)"}`,
                  borderRadius: "var(--radius)", padding: "22px 18px",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
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
                  borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14, boxShadow: a.accent ? "0 0 16px var(--yellow-glow)" : "none",
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

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <Icon name="alert" size={13} color="var(--grey-dim)" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)", letterSpacing: "0.3px" }}>
              All communications are end-to-end encrypted and ephemeral
            </span>
          </div>
        </div>

        {/* ── RIGHT COLUMN: recent activity + quick links ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Recent rooms panel */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", letterSpacing: "1.5px", fontWeight: 700 }}>
                RECENT ACTIVITY
              </div>
              {recentRooms.length > 0 && (
                <button
                  onClick={() => { localStorage.removeItem("recent_rooms"); setRecentRooms([]); }}
                  style={{ border: "none", background: "transparent", color: "var(--grey)", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", padding: "4px 8px" }}
                >
                  CLEAR
                </button>
              )}
            </div>
            {recentRooms.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Icon name="history" size={26} color="var(--grey-dim)" />
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--grey)", marginTop: 10 }}>No recent rooms yet</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)", marginTop: 6 }}>Create or join a room to see it here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentRooms.map((room) => <RecentRoomCard key={room.roomHash} room={room} />)}
              </div>
            )}
          </div>

          {/* Quick access links */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 12 }}>
              QUICK ACCESS
            </div>
            {[
              { icon: "book",     label: "User Guide",  page: "userguide" },
              { icon: "settings", label: "Settings",    page: "settings" },
            ].map((item, idx, arr) => (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 0",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--grey)", fontFamily: "var(--font-mono)", fontSize: 12,
                  borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--white)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--grey)"}
              >
                <Icon name={item.icon} size={14} color="currentColor" />
                {item.label}
                <span style={{ marginLeft: "auto", fontSize: 14 }}>›</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* AlertBar is now global, Toast removed */}
    </WebLayout>
  );
};

export default HomeScreen;