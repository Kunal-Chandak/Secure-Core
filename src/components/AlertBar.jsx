import { useEffect } from "react";
import Icon from "./Icon";
import { useAppContext } from "../context/AppContext";

const AlertBar = () => {
  const { alert, hideAlert } = useAppContext();
  const { show, message, type } = alert || {};

  useEffect(() => {
    if (!show) return;
    const tid = setTimeout(() => hideAlert(), 2800);
    return () => clearTimeout(tid);
  }, [show, message, hideAlert]);

  if (!show || !message) return null;

  const colors = {
    success: { bg: "rgba(40,200,100,0.92)", border: "rgba(40,200,100,0.6)", icon: "check" },
    warning: { bg: "rgba(245,196,0,0.92)", border: "rgba(245,196,0,0.6)", icon: "alert" },
    error:   { bg: "rgba(255,59,59,0.92)", border: "rgba(255,59,59,0.6)", icon: "alert" },
    info:    { bg: "rgba(50,130,255,0.92)", border: "rgba(50,130,255,0.6)", icon: "alert" },
  };

  const { bg, border, icon } = colors[type] || colors.error;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 12,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 240,
        maxWidth: "min(92vw, 420px)",
        boxShadow: "0 0 24px rgba(0,0,0,0.35)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "#fff",
        letterSpacing: "0.5px",
        pointerEvents: "none",
        opacity: show ? 1 : 0,
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message}</div>
    </div>
  );
};

export default AlertBar;
