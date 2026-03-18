import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { QRCode } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { downloadFileDropWithProgress } from "../api";
import { deriveDropKey, decryptBufferRaw } from "../utils/crypto";
import WebLayout from "../components/WebLayout";

const fmtExpiry = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
};

const FileReadyScreen = ({ navigate }) => {
  const { drop, showAlert } = useAppContext();
  const [seconds, setSeconds] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    if (!drop?.expiryTimestamp) { navigate("home"); return; }
    const getExpiryMs = () => {
      if (typeof drop.expiryTimestamp === "number") return drop.expiryTimestamp;
      const parsed = Date.parse(drop.expiryTimestamp);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };
    const update = () => setSeconds(Math.max(0, Math.floor((getExpiryMs() - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [drop, navigate]);

  useEffect(() => {
    const shouldDownload = drop?.isReceiver && drop?.fileId && drop?.dropHash && drop?.code && drop?.iv && drop?.authTag;
    if (!shouldDownload) return;
    const downloadAndDecrypt = async () => {
      setDownloading(true); setDownloadError(null);
      setDownloadStatus("Downloading encrypted file..."); setDownloadProgress(0);
      try {
        const key = await deriveDropKey(drop.code);
        const { arrayBuffer } = await downloadFileDropWithProgress(drop.fileId, drop.dropHash, (p) => setDownloadProgress(p));
        setDownloadStatus("Decrypting file...");
        const plaintext = await decryptBufferRaw(key, new Uint8Array(arrayBuffer), drop.iv, drop.authTag);
        const blob = new Blob([plaintext], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = drop.fileName || "secure_file";
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        setDownloadStatus("Download complete! Check your downloads folder."); setDownloaded(true);
      } catch (err) {
        setDownloadError(err?.message || String(err)); setDownloadStatus("Download failed. Please try again.");
      } finally { setDownloading(false); }
    };
    downloadAndDecrypt();
  }, [drop]);

  return (
    <WebLayout navigate={navigate} currentPage="filedrop">
      <style>{`
        .fileready-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 900px;
        }
        @media (min-width: 820px) {
          .fileready-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button className="back-btn" onClick={() => navigate("home")} style={{ marginBottom: 16 }}>
          <Icon name="home" size={16} /> HOME
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="success-circle">
            <Icon name="check" size={24} color="var(--green)" />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              File <span className="text-yellow">Ready</span>
            </h2>
            <p className="text-grey" style={{ fontSize: 14, margin: "6px 0 0" }}>
              Share the QR code or drop code with the recipient
            </p>
          </div>
        </div>
      </div>

      <div className="fileready-grid">

        {/* ── LEFT: QR + code ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {drop?.code && (
            <>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Drop Code</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="code-display" style={{ gap: 6 }}>
                    {drop.code.split("").map((d, i) => (
                      <div key={i} className="code-digit" style={{ width: 32, height: 44, lineHeight: "44px" }}>{d}</div>
                    ))}
                  </div>
                  <button className="btn-icon" onClick={() => { navigator.clipboard?.writeText(drop.code); showAlert("Drop code copied", "success"); }}>
                    <Icon name="copy" size={15} />
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
                <div>
                  <div className="label" style={{ justifyContent: "center", marginBottom: 14 }}>QR Code</div>
                  <QRCode value={JSON.stringify({ type: "secure_drop", code: drop.code })} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: file details + timer ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* File card */}
          <div className="card card-glow" style={{ padding: "24px 20px" }}>
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
                    <Icon name="check" size={9} color="var(--green)" /> ENCRYPTED
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="clock" size={16} color="var(--yellow)" />
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--grey)" }}>FILE SELF-DESTRUCTS IN</div>
                  <div className="timer-display" style={{ fontSize: 18 }}>{fmtExpiry(seconds)}</div>
                </div>
              </div>
              <div className="badge red" style={{ fontSize: 10 }}>1-TIME ONLY</div>
            </div>
          </div>

          {/* Download status (receiver) */}
          {drop?.isReceiver && (
            <div className="card card-glow" style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                Download Status
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--grey)", marginBottom: 12 }}>
                {downloadStatus || "Preparing download..."}
              </div>
              {downloading && (
                <div className="progress-bar" style={{ marginBottom: 12 }}>
                  <div style={{ width: `${Math.round(downloadProgress * 100)}%` }} />
                </div>
              )}
              {downloadError && (
                <div style={{ color: "var(--red)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Error: {downloadError}</div>
              )}
              {downloaded && (
                <div style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>File downloaded to your device.</div>
              )}
            </div>
          )}

          <button className="btn-secondary" onClick={() => navigate("home")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="home" size={16} color="var(--yellow)" />
              BACK TO HOME
            </span>
          </button>
        </div>

      </div>
    </WebLayout>
  );
};

export default FileReadyScreen;