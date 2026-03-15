import { useState, useEffect } from "react";
import Icon from "./Icon";

/* ── Logo ── */
export const LogoMark = ({ size = "sm" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <svg width={size === "lg" ? 48 : 36} height={size === "lg" ? 48 : 36} viewBox="0 0 48 48">
      <polygon
        points="24,4 42,14 42,34 24,44 6,34 6,14"
        fill="none" stroke="#F5C400" strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 6px rgba(245,196,0,0.6))" }}
      />
      <polygon
        points="24,10 37,17 37,31 24,38 11,31 11,17"
        fill="rgba(245,196,0,0.08)" stroke="rgba(245,196,0,0.3)" strokeWidth="1"
      />
      <text x="24" y="29" textAnchor="middle"
        fontFamily="'Share Tech Mono', monospace"
        fontSize="14" fill="#F5C400" fontWeight="bold">SC</text>
    </svg>
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size === "lg" ? 22 : 18, letterSpacing: "-0.3px" }}>
        SECURE<span style={{ color: "var(--yellow)" }}>CORE</span>
      </div>
      {size === "lg" && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)", letterSpacing: "1px", marginTop: 2 }}>
          ZERO-TRUST ENCRYPTED
        </div>
      )}
    </div>
  </div>
);

/* ── Device ID chip ── */
export const DeviceId = ({ id, iconSize = 18, textSize = 12 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Icon name="fingerprint" size={iconSize} color="var(--grey)" />
    <span style={{ fontFamily: "var(--font-mono)", fontSize: textSize, color: "var(--white)", fontWeight: 700, letterSpacing: "0.5px" }}>
      {id || "DEV-A4F2-8BC1"}
    </span>
  </div>
);

/* ── Terminal loading lines ── */
export const TerminalLoader = ({ lines = [], visible = true }) => {
  const [shown, setShown] = useState([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visible) return setShown([]);
    lines.forEach((l, i) => {
      setTimeout(() => setShown((p) => [...p, l]), i * 320);
    });
  }, [visible, lines]);

  return (
    <div style={{
      background: "rgba(0,0,0,0.5)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "12px 16px",
      minHeight: 80,
    }}>
      {shown.map((l, i) => (
        <div
          key={i}
          className="terminal-line"
          style={{ animationDelay: `${i * 0.32}s`, marginBottom: 4 }}
        >
          <span style={{ color: "var(--yellow)", marginRight: 8 }}>{">"}</span>
          {l}
        </div>
      ))}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--yellow)",
        animation: "pulseDot 1s infinite",
      }}>█</span>
    </div>
  );
};

/* ── Security notice card ── */
export const SecurityNotice = ({ text }) => (
  <div style={{
    display: "flex", gap: 12,
    background: "rgba(245,196,0,0.06)",
    border: "1px solid rgba(245,196,0,0.2)",
    borderRadius: 10, padding: "14px 16px",
  }}>
    <Icon name="shield" size={18} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 2 }} />
    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--grey)", lineHeight: 1.6 }}>
      {text}
    </p>
  </div>
);

/* ── QR Code visual ── */
export const QRCode = ({ value = "SECURE-CORE" }) => {
  const size = 13;
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
      const val = inFinder || (r * 31 + c * 17 + seed) % 3 === 0;
      cells.push({ r, c, v: val });
    }
  }

  return (
    <div className="qr-container">
      <svg width="140" height="140" viewBox={`0 0 ${size * 10 + 10} ${size * 10 + 10}`}>
        <rect width="100%" height="100%" fill="white" />
        {cells.map(({ r, c, v }) =>
          v ? <rect key={`${r}-${c}`} x={c * 10 + 5} y={r * 10 + 5} width="9" height="9" fill="#0B0B0B" rx="1" /> : null
        )}
        {[[0, 0], [0, 10], [10, 0]].map(([rx, ry], i) => (
          <g key={i}>
            <rect x={rx + 5}  y={ry + 5}  width="25" height="25" fill="#0B0B0B" rx="3" />
            <rect x={rx + 8}  y={ry + 8}  width="19" height="19" fill="white"   rx="2" />
            <rect x={rx + 11} y={ry + 11} width="13" height="13" fill="#0B0B0B" rx="2" />
          </g>
        ))}
      </svg>
    </div>
  );
};
