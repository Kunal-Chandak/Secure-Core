import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { useAppContext } from "../context/AppContext";
import { downloadFileDrop } from "../api";

const fmtExpiry = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
};

const FileReadyScreen = ({ navigate }) => {
  const { drop } = useAppContext();
  const [seconds,     setSeconds]     = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [progress,    setProgress]    = useState(0);

  useEffect(() => {
    if (!drop?.expiryTimestamp) {
      navigate("home");
      return;
    }

    const getExpiryMs = () => {
      if (typeof drop.expiryTimestamp === "number") return drop.expiryTimestamp;
      const parsed = Date.parse(drop.expiryTimestamp);
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
  }, [drop, navigate]);

  const handleDownload = async () => {
    if (!drop?.fileId || !drop?.dropHash) return;

    setDownloading(true);
    setProgress(0);

    const progTimer = setInterval(() => {
      setProgress(p => Math.min(99, p + Math.random() * 12));
    }, 120);

    try {
      const res = await downloadFileDrop(drop.fileId, drop.dropHash);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const fileName = res.headers.get("x-file-filename") || drop.fileName || "secure-file.bin";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setProgress(100);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed: " + (err.message || err));
    } finally {
      clearInterval(progTimer);
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>

        {/* Nav */}
        <div className="nav-header" style={{ justifyContent: "flex-start" }}>
          <button className="back-btn" onClick={() => navigate("home")}>
            <Icon name="home" size={16} /> HOME
          </button>
        </div>

        {/* ── Success animation ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, marginTop: 16 }}>
          <div className="success-circle">
            <Icon name="check" size={36} color="var(--green)" />
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 6 }}>
          File <span className="text-yellow">Ready</span>
        </h2>
        <p className="text-grey" style={{ fontSize: 14, marginBottom: 12 }}>
          Decryption complete. Download your secure file below.
        </p>
        {drop?.code && (
          <div style={{ marginBottom: 20 }}>
            <div className="label" style={{ marginBottom: 6 }}>Drop Code</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="code-display" style={{ gap: 6 }}>
                {drop.code.split("").map((d, i) => (
                  <div key={i} className="code-digit" style={{ width: 32, height: 44, lineHeight: "44px" }}>
                    {d}
                  </div>
                ))}
              </div>
              <button className="btn-icon" onClick={() => {
                navigator.clipboard?.writeText(drop.code);
                alert("Drop code copied");
              }}>
                <Icon name="copy" size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── File detail card ── */}
        <div className="card card-glow" style={{ padding: "24px 20px", marginBottom: 20, textAlign: "left" }}>
          <div className="file-card" style={{ marginBottom: 16 }}>
            <div className="file-icon-box" style={{ width: 52, height: 52 }}>
              <Icon name="file" size={24} color="var(--yellow)" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                {drop?.fileName || "secure-file.bin"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span className="badge" style={{ fontSize: 10 }}>
                  {drop?.fileSize ? `${Math.round(drop.fileSize / 1024)} KB` : ""}
                </span>
                <span className="badge green" style={{ fontSize: 10 }}>
                  <Icon name="check" size={9} color="var(--green)" /> DECRYPTED
                </span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="clock" size={16} color="var(--yellow)" />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--grey)" }}>
                  FILE SELF-DESTRUCTS IN
                </div>
                <div className="timer-display" style={{ fontSize: 18 }}>
                  {fmtExpiry(seconds)}
                </div>
              </div>
            </div>
            <div className="badge red" style={{ fontSize: 10 }}>1-TIME ONLY</div>
          </div>
        </div>

        {/* ── Download states ── */}
        {progress === 100 ? (
          <div style={{
            background: "rgba(0,230,118,0.08)",
            border: "1px solid rgba(0,230,118,0.25)",
            borderRadius: 10, padding: 16, marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <Icon name="check" size={20} color="var(--green)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--green)" }}>
                DOWNLOAD COMPLETE
              </span>
            </div>
          </div>
        ) : downloading ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)" }}>DOWNLOADING...</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)" }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleDownload} style={{ marginBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="download" size={18} color="#0B0B0B" />
              DOWNLOAD FILE
            </span>
          </button>
        )}

        <button className="btn-secondary" onClick={() => navigate("home")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="home" size={16} color="var(--yellow)" />
            BACK TO HOME
          </span>
        </button>

      </div>
    </div>
  );
};

export default FileReadyScreen;
