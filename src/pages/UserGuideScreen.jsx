import { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon";

/* ─────────────────────────────────────────────
   GUIDE DATA  (mirrors Dart GuideItem list)
───────────────────────────────────────────── */
const guides = [
  {
    icon: "shield",
    title: "Welcome to Secure Core",
    description:
      "End-to-end encrypted messaging platform for secure, private communication",
    details: [
      "All messages are encrypted with AES-GCM",
      "Self-destructing rooms for privacy",
      "No data stored on servers",
    ],
  },
  {
    icon: "plus",
    title: "Create a Room",
    description: "Start a secure session with custom expiration time",
    details: [
      "Tap 'Create Secret Room'",
      "Set room expiration time (5 min – 24 hours)",
      "Share code or QR with trusted contacts",
    ],
  },
  {
    icon: "login",
    title: "Join a Room",
    description: "Connect to existing rooms using code or QR scan",
    details: [
      "Use room code for quick access",
      "Scan QR code from another device",
      "Auto-fill from recent activities",
    ],
  },
  {
    icon: "chat",
    title: "Send Messages",
    description: "Share encrypted messages, images, and files",
    details: [
      "Messages are encrypted end-to-end",
      "Delete messages at any time",
      "Share images and files securely",
    ],
  },
  {
    icon: "lockClock",
    title: "Room Security",
    description: "Understanding how room expiration and burnout works",
    details: [
      "Rooms auto-delete after expiration",
      "Creator can manually burn rooms",
      "All data removed from S3 storage",
    ],
  },
];

/* ─────────────────────────────────────────────
   INLINE SVG ICONS  (matches project icon set)
───────────────────────────────────────────── */
const GuideIcon = ({ name, size = 60, color = "var(--yellow)" }) => {
  const icons = {
    shield: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    login: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
    chat: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    lockClock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
        <line x1="12" y1="14" x2="12" y2="16" />
      </svg>
    ),
    check: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    arrowLeft: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    arrowRight: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    checkDone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };
  return icons[name] || null;
};

/* ─────────────────────────────────────────────
   DETAIL CARD  (animated slide-up)
───────────────────────────────────────────── */
const DetailCard = ({ text, index, visible }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 120 + index * 110);
    return () => clearTimeout(t);
  }, [visible, index]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px",
      background: "var(--card2, #141414)",
      border: "1.5px solid rgba(245,196,0,0.18)",
      borderRadius: 12,
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {/* check icon badge */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: "rgba(245,196,0,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <GuideIcon name="check" />
      </div>
      <span style={{
        fontFamily: "var(--font-body, 'Inter', sans-serif)",
        fontSize: 14, lineHeight: 1.45,
        color: "var(--white, #F0F0F0)",
      }}>
        {text}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE SLIDE
───────────────────────────────────────────── */
const GuidePage = ({ guide, visible, direction }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!visible) { setMounted(false); return; }
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, [visible]);

  const tx = mounted ? "0px" : direction === "next" ? "48px" : "-48px";

  return (
    <div style={{
      position: "absolute", inset: 0, overflowY: "auto",
      padding: "8px 20px 24px",
      opacity: mounted ? 1 : 0,
      transform: `translateX(${tx})`,
      transition: "opacity 0.38s ease, transform 0.38s ease",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 0,
    }}>
      {/* Big icon */}
      <div style={{
        width: 110, height: 110, borderRadius: "50%",
        background: "rgba(245,196,0,0.12)",
        border: "1.5px solid rgba(245,196,0,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28, marginTop: 8,
        boxShadow: "0 0 40px rgba(245,196,0,0.1)",
        flexShrink: 0,
        transform: mounted ? "scale(1)" : "scale(0.7)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
      }}>
        <GuideIcon name={guide.icon} size={54} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
        fontWeight: 700, fontSize: 22, letterSpacing: "-0.3px",
        color: "var(--yellow, #F5C400)",
        textAlign: "center", marginBottom: 12,
        lineHeight: 1.25,
      }}>
        {guide.title}
      </div>

      {/* Description */}
      <div style={{
        fontFamily: "var(--font-body, 'Inter', sans-serif)",
        fontSize: 14, lineHeight: 1.55,
        color: "var(--grey, #888)",
        textAlign: "center",
        marginBottom: 28,
        maxWidth: 340,
      }}>
        {guide.description}
      </div>

      {/* Detail cards */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {guide.details.map((d, i) => (
          <DetailCard key={i} text={d} index={i} visible={visible} />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const UserGuideScreen = ({ navigate }) => {
  const [current, setCurrent]   = useState(0);
  const [direction, setDir]     = useState("next");
  const [visiblePage, setVisible] = useState(0);
  const total = guides.length;

  const goTo = (idx, dir) => {
    if (idx < 0 || idx >= total) return;
    setDir(dir);
    setVisible(-1); // unmount current
    setTimeout(() => {
      setCurrent(idx);
      setVisible(idx);
    }, 40);
  };

  const next = () => goTo(current + 1, "next");
  const prev = () => goTo(current - 1, "prev");

  // initialise
  useEffect(() => { setVisible(0); }, []);

  const isFirst = current === 0;
  const isLast  = current === total - 1;

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      background: "var(--bg, #0B0B0B)",
      zIndex: 2,
    }}>

      {/* ══ HEADER ══ */}
      <div style={{
        background: "rgba(11,11,11,0.97)",
        borderBottom: "1px solid var(--border, #1E1E1E)",
        padding: "0 20px",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
        position: "relative",
      }}>
        {/* yellow top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, var(--yellow, #F5C400), transparent)",
          opacity: 0.5,
        }} />

        <div style={{
          maxWidth: 480, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 66,
        }}>
          {/* Back button */}
          <button
            className="back-btn"
            onClick={() => navigate && navigate("home")}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--card2, #141414)",
              border: "1px solid var(--border, #1E1E1E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--yellow, #F5C400)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--yellow-dim, rgba(245,196,0,0.1))";
              e.currentTarget.style.borderColor = "var(--border-hover, rgba(245,196,0,0.3))";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--card2, #141414)";
              e.currentTarget.style.borderColor = "var(--border, #1E1E1E)";
            }}
          >
            <GuideIcon name="arrowLeft" />
          </button>

          {/* Title */}
          <span style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontWeight: 700, fontSize: 18,
            color: "var(--yellow, #F5C400)",
            letterSpacing: "-0.2px",
          }}>
            User Guide
          </span>

          {/* Page counter */}
          <div style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 12, color: "var(--yellow, #F5C400)",
            background: "var(--card2, #141414)",
            border: "1px solid var(--border, #1E1E1E)",
            borderRadius: 8, padding: "6px 12px",
            letterSpacing: "0.5px",
          }}>
            {String(current + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* ══ DOT INDICATORS ══ */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: 8, padding: "14px 0 10px",
        flexShrink: 0,
      }}>
        {guides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? "next" : "prev")}
            style={{
              height: 8,
              width: i === current ? 28 : 8,
              borderRadius: 4, border: "none",
              background: i === current
                ? "var(--yellow, #F5C400)"
                : "rgba(245,196,0,0.25)",
              cursor: "pointer",
              padding: 0,
              transition: "width 0.3s ease, background 0.3s ease",
              boxShadow: i === current ? "0 0 8px rgba(245,196,0,0.5)" : "none",
            }}
          />
        ))}
      </div>

      {/* ══ PAGE CONTENT ══ */}
      <div style={{
        flex: 1, position: "relative",
        maxWidth: 480, width: "100%", margin: "0 auto",
        overflow: "hidden",
      }}>
        {guides.map((guide, i) => (
          <GuidePage
            key={i}
            guide={guide}
            visible={visiblePage === i}
            direction={direction}
          />
        ))}
      </div>

      {/* ══ NAV BUTTONS ══ */}
      <div style={{
        position: "sticky",
        bottom: "72px",
        zIndex: 5,
        background: "rgba(11,11,11,0.97)",
        borderTop: "1px solid var(--border, #1E1E1E)",
        padding: "14px 20px",
        paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 480, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
        }}>
          {/* Previous */}
          <button
            onClick={prev}
            disabled={isFirst}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 20px", borderRadius: 12, border: "none",
              background: isFirst ? "rgba(245,196,0,0.06)" : "var(--yellow, #F5C400)",
              color: isFirst ? "rgba(245,196,0,0.3)" : "#0B0B0B",
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontWeight: 600, fontSize: 14,
              cursor: isFirst ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isFirst ? 0.5 : 1,
            }}
          >
            <GuideIcon name="arrowLeft" size={16} />
            Previous
          </button>

          {/* Progress dots (mini) */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {guides.map((_, i) => (
              <div key={i} style={{
                width: i === current ? 18 : 6,
                height: 4, borderRadius: 2,
                background: i === current
                  ? "var(--yellow, #F5C400)"
                  : "rgba(245,196,0,0.2)",
                transition: "width 0.3s ease",
              }} />
            ))}
          </div>

          {/* Next / Done */}
          <button
            onClick={isLast ? () => navigate && navigate("home") : next}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 20px", borderRadius: 12, border: "none",
              background: "var(--yellow, #F5C400)",
              color: "#0B0B0B",
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontWeight: 600, fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 0 18px rgba(245,196,0,0.3)",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {isLast ? "Done" : "Next"}
            <GuideIcon name={isLast ? "checkDone" : "arrowRight"} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuideScreen;
