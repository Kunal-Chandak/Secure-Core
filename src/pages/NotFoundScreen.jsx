import Icon from "../components/Icon";

const NotFoundScreen = ({ navigate }) => (
  <div className="page" style={{ alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
    <div style={{ maxWidth: 400 }}>

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", letterSpacing: "2px", marginBottom: 16 }}>
        ERR_CODE: 0x404
      </div>

      <div style={{ fontFamily: "var(--font-display)", fontSize: 72, fontWeight: 800, color: "var(--yellow)", marginBottom: 8, lineHeight: 1 }}>
        <span className="glitch" data-text="404">404</span>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        Secure Route <span className="text-yellow">Not Found</span>
      </h2>
      <p className="text-grey" style={{ fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        The encrypted channel you're looking for does not exist or has self-destructed.
      </p>

      {/* Trace log */}
      <div style={{
        background: "rgba(255,59,59,0.06)",
        border: "1px solid rgba(255,59,59,0.2)",
        borderRadius: 10, padding: "14px 16px", marginBottom: 28,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", marginBottom: 6 }}>
          TRACE LOG
        </div>
        {[
          "Route lookup failed: /unknown",
          "No matching encrypted tunnel found",
          "Connection terminated ✗",
        ].map((line, i) => (
          <div
            key={i}
            className="terminal-line"
            style={{ color: "var(--red)", opacity: 0.7, animationDelay: `${i * 0.4}s`, marginBottom: 3 }}
          >
            {line}
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={() => navigate("home")}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="home" size={18} color="#0B0B0B" />
          RETURN TO BASE
        </span>
      </button>

    </div>
  </div>
);

export default NotFoundScreen;
