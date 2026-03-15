import { useState } from "react";
import Icon from "../components/Icon";
import { useAppContext } from "../context/AppContext";

/* ─────────────────────────────────────────────
   INLINE SVG ICONS
───────────────────────────────────────────── */
const SI = ({ name, size = 20, color = "var(--yellow)" }) => {
  const s = { width: size, height: size, display: "block" };
  const icons = {
    arrowLeft: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    arrowRight: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    screenshot: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    clock: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    moon: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    sun: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    text: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
    book: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    faq: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    info: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    trash: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
      </svg>
    ),
    shield: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    close: (
      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  };
  return icons[name] || null;
};

/* ─────────────────────────────────────────────
   STORAGE HELPERS  (localStorage as substitute)
───────────────────────────────────────────── */
const deleteAll = () => {
  Object.keys(localStorage)
    .filter(k => k.startsWith("securecore:"))
    .forEach(k => localStorage.removeItem(k));
};

/* ─────────────────────────────────────────────
   REUSABLE PRIMITIVES
───────────────────────────────────────────── */

/** Section label — yellow or red */
const SectionHeader = ({ children, red = false }) => (
  <div style={{
    fontFamily: "var(--font-mono)",
    fontSize: 10, letterSpacing: "1.5px", fontWeight: 700,
    color: red ? "var(--red, #FF3B3B)" : "var(--yellow)",
    marginBottom: 10,
  }}>
    {children}
  </div>
);

/** Yellow-bordered card shell */
const Card = ({ children, style = {}, red = false }) => (
  <div style={{
    background: red ? "rgba(255,59,59,0.07)" : "var(--card2, #141414)",
    border: `1.5px solid ${red ? "rgba(255,59,59,0.28)" : "rgba(245,196,0,0.18)"}`,
    borderRadius: 12,
    padding: "14px 16px",
    ...style,
  }}>
    {children}
  </div>
);

/** Icon badge */
const IconBadge = ({ name, red = false }) => (
  <div style={{
    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
    background: red ? "rgba(255,59,59,0.14)" : "rgba(245,196,0,0.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <SI name={name} size={18} color={red ? "var(--red, #FF3B3B)" : "var(--yellow)"} />
  </div>
);

/** Toggle row card */
const ToggleSetting = ({ iconName, title, subtitle, value, onChange }) => {
  const [hover, setHover] = useState(false);
  return (
    <Card style={{ transition: "border-color 0.2s", borderColor: hover ? "rgba(245,196,0,0.35)" : "rgba(245,196,0,0.18)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onChange(!value)}
      >
        <IconBadge name={iconName} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
            color: "var(--white)", marginBottom: 3,
          }}>{title}</div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 11,
            color: "var(--grey)",
          }}>{subtitle}</div>
        </div>
        {/* Custom toggle */}
        <div style={{
          width: 44, height: 26, borderRadius: 13, flexShrink: 0,
          background: value ? "var(--yellow)" : "var(--card, #1A1A1A)",
          border: `1.5px solid ${value ? "var(--yellow)" : "rgba(255,255,255,0.1)"}`,
          position: "relative", transition: "all 0.25s",
          boxShadow: value ? "0 0 10px rgba(245,196,0,0.35)" : "none",
        }}>
          <div style={{
            position: "absolute", top: 3,
            left: value ? 20 : 3,
            width: 18, height: 18, borderRadius: "50%",
            background: value ? "#0B0B0B" : "var(--grey)",
            transition: "left 0.25s",
          }} />
        </div>
      </div>
    </Card>
  );
};

/** Tappable option card (with arrow) */
const OptionCard = ({ iconName, title, subtitle, onTap, red = false }) => {
  const [hover, setHover] = useState(false);
  return (
    <Card
      red={red}
      style={{
        cursor: "pointer",
        transition: "all 0.2s",
        borderColor: hover
          ? (red ? "rgba(255,59,59,0.55)" : "rgba(245,196,0,0.38)")
          : (red ? "rgba(255,59,59,0.28)" : "rgba(245,196,0,0.18)"),
        background: hover
          ? (red ? "rgba(255,59,59,0.12)" : "rgba(245,196,0,0.05)")
          : (red ? "rgba(255,59,59,0.07)" : "var(--card2, #141414)"),
      }}
      onClick={onTap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconBadge name={iconName} red={red} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
            color: red ? "var(--red, #FF3B3B)" : "var(--white)", marginBottom: 3,
          }}>{title}</div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 11,
            color: "var(--grey)",
          }}>{subtitle}</div>
        </div>
        <SI name="arrowRight" size={18} color={red ? "rgba(255,59,59,0.5)" : "rgba(245,196,0,0.45)"} />
      </div>
    </Card>
  );
};

/* ─────────────────────────────────────────────
   MODAL BASE
───────────────────────────────────────────── */
const Modal = ({ onClose, title, children, actions }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 24px",
    animation: "fadeIn 0.15s ease",
  }}>
    <div style={{
      width: "100%", maxWidth: 400,
      background: "var(--card2, #141414)",
      border: "1.5px solid rgba(245,196,0,0.35)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 0 40px rgba(245,196,0,0.12), 0 20px 60px rgba(0,0,0,0.8)",
      animation: "scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Modal header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 20px 14px",
        borderBottom: "1px solid var(--border, #1E1E1E)",
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
          color: "var(--yellow)",
        }}>{title}</span>
        <button onClick={onClose} style={{
          width: 30, height: 30, borderRadius: 8, border: "none",
          background: "var(--card, #1A1A1A)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <SI name="close" size={15} color="var(--grey)" />
        </button>
      </div>

      {/* Modal body */}
      <div style={{ padding: "16px 20px", maxHeight: "60vh", overflowY: "auto" }}>
        {children}
      </div>

      {/* Modal actions */}
      {actions && (
        <div style={{
          display: "flex", gap: 10, padding: "12px 20px 18px",
          borderTop: "1px solid var(--border, #1E1E1E)",
        }}>
          {actions}
        </div>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   ABOUT MODAL
───────────────────────────────────────────── */
const AboutModal = ({ onClose }) => {
  const features = [
    "AES-256-GCM Encryption",
    "HMAC Authentication",
    "QR Code Room Sharing",
    "Secure File Transfer",
    "Self-Destructing Rooms",
  ];
  return (
    <Modal
      title="About Secure Core"
      onClose={onClose}
      actions={
        <button onClick={onClose} style={{
          flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
          background: "var(--yellow)", color: "#0B0B0B",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          cursor: "pointer",
        }}>Close</button>
      }
    >
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 13,
        color: "var(--yellow)", marginBottom: 6,
      }}>Secure Core v1.0.0</div>
      <div style={{
        fontFamily: "var(--font-body)", fontSize: 12,
        color: "var(--grey)", marginBottom: 18,
      }}>End-to-End Encrypted Messaging Platform</div>

      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10,
        letterSpacing: "1.2px", color: "var(--white)",
        marginBottom: 10,
      }}>KEY FEATURES</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--yellow)", flexShrink: 0,
              boxShadow: "0 0 6px rgba(245,196,0,0.5)",
            }} />
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 13,
              color: "var(--white)", opacity: 0.85,
            }}>{f}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, fontFamily: "var(--font-mono)",
        fontSize: 10, color: "var(--grey-dim, #444)",
        letterSpacing: "0.5px",
      }}>© 2024 SECURE CORE TEAM</div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   FAQ MODAL
───────────────────────────────────────────── */
const FAQModal = ({ onClose }) => {
  const faqs = [
    {
      q: "How does end-to-end encryption work?",
      a: "Your messages are encrypted on your device using AES-256-GCM before being sent. Only the recipient can decrypt them.",
    },
    {
      q: "Can I share encrypted files?",
      a: "Yes! Secure Core supports encrypted file transfer. Files are encrypted before upload and can only be decrypted by room members.",
    },
    {
      q: "What happens when a room is deleted?",
      a: "Once deleted, the room cannot be recovered. All messages and files are permanently removed from the server.",
    },
    {
      q: "How do I create a secure room?",
      a: "Use the 'Create Room' button on the home screen. You can share the QR code with others to join.",
    },
    {
      q: "Is my data stored on the server?",
      a: "Messages are temporarily stored encrypted. After room deletion, all data is permanently removed.",
    },
  ];

  return (
    <Modal
      title="FAQs & Support"
      onClose={onClose}
      actions={
        <button onClick={onClose} style={{
          flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
          background: "var(--yellow)", color: "#0B0B0B",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          cursor: "pointer",
        }}>Close</button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {faqs.map((item, i) => (
          <div key={i}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
              color: "var(--yellow)", marginBottom: 6,
            }}>{item.q}</div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12,
              color: "var(--grey)", lineHeight: 1.55,
            }}>{item.a}</div>
            {i < faqs.length - 1 && (
              <div style={{
                marginTop: 16, height: 1,
                background: "var(--border, #1E1E1E)",
              }} />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   CLEAR DATA CONFIRM MODAL
───────────────────────────────────────────── */
const ClearDataModal = ({ onClose, onConfirm }) => (
  <Modal
    title="Clear All Data?"
    onClose={onClose}
    actions={
      <>
        <button onClick={onClose} style={{
          flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer",
          background: "transparent",
          border: "1px solid rgba(245,196,0,0.5)",
          color: "var(--yellow)",
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
          background: "var(--red, #FF3B3B)", color: "#fff",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          cursor: "pointer",
          boxShadow: "0 4px 18px rgba(255,59,59,0.35)",
        }}>Delete</button>
      </>
    }
  >
    <div style={{
      fontFamily: "var(--font-body)", fontSize: 14,
      color: "var(--grey)", lineHeight: 1.55,
    }}>
      This will delete all cached data and recent rooms. This action cannot be undone.
    </div>
  </Modal>
);

/* ─────────────────────────────────────────────
   THEME SELECTOR
───────────────────────────────────────────── */
const ThemeSelector = ({ dark, onToggle }) => (
  <Card>
    <div style={{
      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
      color: "var(--white)", marginBottom: 12,
    }}>Color Scheme</div>
    <div style={{ display: "flex", gap: 10 }}>
      {[
        { label: "Dark",  icon: "moon",  val: true  },
        { label: "Light", icon: "sun",   val: false },
      ].map(({ label, icon, val }) => {
        const sel = dark === val;
        return (
          <button
            key={label}
            onClick={onToggle}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
              background: sel ? "rgba(245,196,0,0.18)" : "rgba(255,255,255,0.04)",
              outline: `1.5px solid ${sel ? "var(--yellow)" : "rgba(255,255,255,0.1)"}`,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}
          >
            <SI name={icon} size={22} color={sel ? "var(--yellow)" : "var(--grey)"} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.5px",
              color: sel ? "var(--yellow)" : "var(--grey)",
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  </Card>
);

/* ─────────────────────────────────────────────
   TEXT SIZE SELECTOR
───────────────────────────────────────────── */
const TextSizeSelector = ({ value, onChange }) => {
  const sizes = [
    { label: "Small",  val: "small"  },
    { label: "Medium", val: "medium" },
    { label: "Large",  val: "large"  },
  ];
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <SI name="text" size={16} color="var(--yellow)" />
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          color: "var(--yellow)",
        }}>Text Size</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {sizes.map(({ label, val }) => {
          const sel = value === val;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: sel ? "rgba(245,196,0,0.18)" : "transparent",
                outline: `1.5px solid ${sel ? "var(--yellow)" : "rgba(255,255,255,0.1)"}`,
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11,
                letterSpacing: "0.5px",
                color: sel ? "var(--yellow)" : "var(--grey)",
              }}
            >
              {label.toUpperCase()}
            </button>
          );
        })}
      </div>
    </Card>
  );
};

/* ─────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────── */
const Toast = ({ message, show }) => (
  <div style={{
    position: "fixed", bottom: "calc(24px + 68px)", left: "50%",
    transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
    opacity: show ? 1 : 0,
    transition: "all 0.3s ease",
    background: "rgba(255,59,59,0.9)",
    color: "#fff",
    fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.5px",
    padding: "10px 20px", borderRadius: 10,
    zIndex: 9999,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  }}>
    {message}
  </div>
);

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const SettingsScreen = ({ navigate }) => {
  const {
    settings,
    setDarkMode,
    setTextSize,
    setMessageTimestamps,
    setShowSenderIds,
  } = useAppContext();

  const { darkMode, textSize, messageTimestamps, showSenderIds } = settings;
  const [modal, setModal] = useState(null); // "about" | "faq" | "clear"
  const [toast, setToast] = useState({ show: false, msg: "" });

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  const handleClearData = () => {
    deleteAll();
    setModal(null);
    showToast("All data cleared");
  };

  const handleThemeToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    showToast(next ? "Dark mode enabled" : "Light mode enabled");
  };

  const handleTextSize = (val) => {
    setTextSize(val);
    showToast(`Text size set to ${val}`);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      background: "var(--bg, #0B0B0B)",
      zIndex: 2,
    }}>

      {/* MODALS */}
      {modal === "about" && <AboutModal onClose={() => setModal(null)} />}
      {modal === "faq"   && <FAQModal   onClose={() => setModal(null)} />}
      {modal === "clear" && (
        <ClearDataModal
          onClose={() => setModal(null)}
          onConfirm={handleClearData}
        />
      )}

      <Toast message={toast.msg} show={toast.show} />

      {/* ══ HEADER ══ */}
      <div style={{
        background: "rgba(11,11,11,0.97)",
        borderBottom: "1px solid var(--border, #1E1E1E)",
        padding: "0 20px",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
        position: "relative",
      }}>
        {/* yellow accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, var(--yellow), transparent)",
          opacity: 0.5,
        }} />

        <div style={{
          maxWidth: 480, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 66,
        }}>
          {/* Back */}
          <button
            onClick={() => navigate?.("home")}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--card2, #141414)",
              border: "1px solid var(--border, #1E1E1E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--yellow)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(245,196,0,0.1)";
              e.currentTarget.style.borderColor = "rgba(245,196,0,0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--card2, #141414)";
              e.currentTarget.style.borderColor = "var(--border, #1E1E1E)";
            }}
          >
            <SI name="arrowLeft" size={18} color="var(--yellow)" />
          </button>

          {/* Title */}
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18,
            color: "var(--yellow)", letterSpacing: "-0.2px",
          }}>
            Settings
          </span>

          {/* Shield badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--card2, #141414)",
            border: "1px solid var(--border, #1E1E1E)",
            borderRadius: 8, padding: "6px 10px",
          }}>
            <SI name="shield" size={12} color="var(--green, #4CAF50)" />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 9,
              color: "var(--green, #4CAF50)", letterSpacing: "0.5px",
            }}>
              SECURE
            </span>
          </div>
        </div>
      </div>

      {/* ══ SCROLLABLE BODY ══ */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "22px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
        maxWidth: 480, width: "100%", margin: "0 auto",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)",
      }}>

        {/* ── SECURITY & PRIVACY ── */}
        <SectionHeader>// SECURITY &amp; PRIVACY</SectionHeader>
        <ToggleSetting
          iconName="shield"
          title="Show Sender IDs"
          subtitle="Display a short sender ID next to messages"
          value={showSenderIds}
          onChange={v => {
            setShowSenderIds(v);
            showToast(v ? "Sender IDs shown" : "Sender IDs hidden");
          }}
        />

        <div style={{ height: 28 }} />

        {/* ── MESSAGING ── */}
        <SectionHeader>// MESSAGING</SectionHeader>
        <ToggleSetting
          iconName="clock"
          title="Message Timestamps"
          subtitle="Display time sent for each message"
          value={messageTimestamps}
          onChange={v => {
            setMessageTimestamps(v);
            showToast(v ? "Timestamps shown" : "Timestamps hidden");
          }}
        />

        <div style={{ height: 28 }} />

        {/* ── APPEARANCE ── */}
        <SectionHeader>// APPEARANCE</SectionHeader>
        <ThemeSelector dark={darkMode} onToggle={handleThemeToggle} />
        <div style={{ height: 10 }} />
        <TextSizeSelector value={textSize} onChange={handleTextSize} />

        <div style={{ height: 28 }} />

        {/* ── HELP & INFORMATION ── */}
        <SectionHeader>// HELP &amp; INFORMATION</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <OptionCard
            iconName="book"
            title="User Guide"
            subtitle="Learn how to use Secure Core"
            onTap={() => navigate?.("userGuide")}
          />
          <OptionCard
            iconName="faq"
            title="FAQs & Support"
            subtitle="Frequently asked questions"
            onTap={() => setModal("faq")}
          />
          <OptionCard
            iconName="info"
            title="About"
            subtitle="Version and app information"
            onTap={() => setModal("about")}
          />
        </div>

        <div style={{ height: 28 }} />

        {/* ── DANGER ZONE ── */}
        <SectionHeader red>// DANGER ZONE</SectionHeader>
        <OptionCard
          iconName="trash"
          title="Clear All Data"
          subtitle="Delete all cached data and recent rooms"
          onTap={() => setModal("clear")}
          red
        />
      </div>
    </div>
  );
};

export default SettingsScreen;
