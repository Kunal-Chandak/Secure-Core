const NAV_PAGES = [
  { id: "home",     label: "Home" },
  { id: "create",   label: "Create Room" },
  { id: "join",     label: "Join Room" },
  { id: "filedrop", label: "File Drop" },
  { id: "receive",  label: "Receive Files" },
];

// Pages where the DemoNav should be completely hidden
// (they manage their own bottom bar / are full-screen layouts)
const NAV_HIDDEN_PAGES = new Set(["chat", "roomcreated", "fileready", "404"]);

const DemoNav = ({ current, navigate }) => {
  if (NAV_HIDDEN_PAGES.has(current)) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 100,
      background: "rgba(11,11,11,0.97)",
      borderTop: "1px solid rgba(245,196,0,0.15)",
      backdropFilter: "blur(12px)",
      overflowX: "auto",
    }}>
      <div style={{
        display: "flex", gap: 4,
        padding: "10px 16px",
        minWidth: "max-content",
      }}>
        {NAV_PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => navigate(p.id)}
            style={{
              padding: "7px 14px",
              background: current === p.id ? "var(--yellow)" : "transparent",
              color: current === p.id ? "#0B0B0B" : "var(--grey)",
              border: `1px solid ${current === p.id ? "var(--yellow)" : "rgba(245,196,0,0.15)"}`,
              borderRadius: 100,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: current === p.id ? 700 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              if (current !== p.id) {
                e.currentTarget.style.color = "var(--yellow)";
                e.currentTarget.style.borderColor = "rgba(245,196,0,0.4)";
              }
            }}
            onMouseLeave={e => {
              if (current !== p.id) {
                e.currentTarget.style.color = "var(--grey)";
                e.currentTarget.style.borderColor = "rgba(245,196,0,0.15)";
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DemoNav;
