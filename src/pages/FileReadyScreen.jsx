import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { QRCode } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { downloadFileDropWithProgress } from "../api";
import { deriveDropKey, decryptBufferRaw } from "../utils/crypto";

const fmtExpiry = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
};

const FileReadyScreen = ({ navigate }) => {
  const { drop } = useAppContext();
  const [seconds, setSeconds] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

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

  useEffect(() => {
    const shouldDownload = drop?.isReceiver && drop?.fileId && drop?.dropHash && drop?.code && drop?.iv && drop?.authTag;
    if (!shouldDownload) return;

    const downloadAndDecrypt = async () => {
      setDownloading(true);
      setDownloadError(null);
      setDownloadStatus("Downloading encrypted file...");
      setDownloadProgress(0);

      try {
        const key = await deriveDropKey(drop.code);

        const { arrayBuffer } = await downloadFileDropWithProgress(
          drop.fileId,
          drop.dropHash,
          (p) => setDownloadProgress(p),
        );

        setDownloadStatus("Decrypting file...");

        const ciphertext = new Uint8Array(arrayBuffer);
        const plaintext = await decryptBufferRaw(key, ciphertext, drop.iv, drop.authTag);

        const blob = new Blob([plaintext], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = drop.fileName || "secure_file";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadStatus("Download complete! Check your downloads folder.");
        setDownloaded(true);
      } catch (err) {
        console.error("Download/decrypt error", err);
        setDownloadError(err?.message || String(err));
        setDownloadStatus("Download failed. Please try again.");
      } finally {
        setDownloading(false);
      }
    };

    downloadAndDecrypt();
  }, [drop]);


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
          Share this QR code or code with the recipient so they can download the file on another device.
        </p>
        {drop?.code && (
          <>
            <div style={{ marginBottom: 16 }}>
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

            <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
              <QRCode value={JSON.stringify({ type: "secure_drop", code: drop.code })} />
            </div>
          </>
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

        {drop?.isReceiver && (
          <div className="card card-glow" style={{ padding: 20, marginBottom: 20, textAlign: "left" }}>
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
              <div style={{ color: "var(--red)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                Error: {downloadError}
              </div>
            )}
            {downloaded && (
              <div style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                File downloaded to your device.
              </div>
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
  );
};

export default FileReadyScreen;
