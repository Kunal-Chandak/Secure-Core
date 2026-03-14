import { useState } from "react";
import Icon from "../components/Icon";
import { SecurityNotice } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { createFileDrop, uploadFileDrop } from "../api";
import { randomCode, sha256, randomBase64 } from "../utils/crypto";

const fmtSize = (b) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`;

const FileDropScreen = ({ navigate }) => {
  const [dragover,   setDragover]   = useState(false);
  const [file,       setFile]       = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [done,       setDone]       = useState(false);
  const [duration,   setDuration]   = useState("1h");
  const [customTime, setCustomTime] = useState("");
  const { setDrop } = useAppContext();

  const handleFile = (f) => {
    setFile(f);
    setProgress(0);
    setDone(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const dropCode = randomCode();
    const dropHash = await sha256(dropCode);

    try {
      // create drop session
      const durationValue = duration === "custom" ? `${parseInt(customTime, 10) || 10}m` : duration;
      const createRes = await createFileDrop(dropHash, durationValue);
      if (!createRes.success) {
        throw new Error(createRes.error || "Failed to create drop");
      }

      // upload the file
      const form = new FormData();
      form.append("dropHash", dropHash);
      form.append("file", file);
      form.append("fileName", file.name);
      form.append("fileSize", String(file.size));
      form.append("iv", randomBase64(12));
      form.append("authTag", randomBase64(16));
      form.append("hmac", randomBase64(32));

      // simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(95, p + Math.random() * 12));
      }, 150);

      const uploadRes = await uploadFileDrop(form);
      clearInterval(progressInterval);
      setProgress(100);

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "Upload failed");
      }

      setDrop({
        code: dropCode,
        dropHash,
        duration,
        expiryTimestamp: Date.parse(createRes.expiryTimestamp),
        fileId: uploadRes.fileId,
        fileName: file.name,
        fileSize: file.size,
      });

      setDone(true);
    } catch (err) {
      console.error("File drop upload failed", err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setDone(false); setProgress(0); };

  return (
    <div className="page">
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Nav */}
        <div className="nav-header">
          <button className="back-btn" onClick={() => navigate("home")}>
            <Icon name="arrowLeft" size={16} /> BACK
          </button>
          <div className="badge">
            <Icon name="upload" size={10} color="var(--yellow)" /> FILE DROP
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 6 }}>
          Secure <span className="text-yellow">File Drop</span>
        </h2>
        <p className="text-grey" style={{ fontSize: 14, marginBottom: 28 }}>
          One-time encrypted file transfer — expires after download
        </p>

        {/* ── Expiry selector ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="label">Self-destruct duration</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["10m", "1h", "24h", "custom"].map((opt) => (
              <button
                key={opt}
                className={`timer-pill ${duration === opt ? "active" : ""}`}
                onClick={() => setDuration(opt)}
              >
                {opt === "10m" ? "10 min" : opt === "1h" ? "1 hour" : opt === "24h" ? "24 hours" : "custom"}
              </button>
            ))}
          </div>
          {duration === "custom" && (
            <div style={{ marginTop: 12 }}>
              <input
                className="input-field"
                placeholder="minutes"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ── Drop zone ── */}
        {!file && (
          <label
            className={`drop-zone ${dragover ? "dragover" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
          >
            <input type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 60, height: 60,
                background: "var(--card2)", border: "1px solid var(--border)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                transition: "all 0.2s",
              }}>
                <Icon name="upload" size={26} color={dragover ? "var(--yellow)" : "var(--grey)"} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                {dragover ? "Drop to encrypt & upload" : "Drag & drop file here"}
              </div>
              <div className="text-grey" style={{ fontSize: 13 }}>or click to browse files</div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="lock" size={13} color="var(--yellow)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)" }}>
                  AES-256-GCM ENCRYPTION
                </span>
              </div>
            </div>
          </label>
        )}

        {/* ── File preview ── */}
        {file && (
          <div style={{ marginBottom: 20 }}>
            <div className="file-card">
              <div className="file-icon-box">
                <Icon name="file" size={22} color="var(--yellow)" />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                  marginBottom: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {file.name}
                </div>
                <div className="text-grey" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {fmtSize(file.size)}
                </div>
              </div>
              <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={16} color="var(--grey)" />
              </button>
            </div>

            {/* Progress */}
            {(uploading || done) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: done ? "var(--green)" : "var(--yellow)" }}>
                    {done ? "ENCRYPTION COMPLETE ✓" : "ENCRYPTING & UPLOADING"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)" }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: done
                        ? "linear-gradient(90deg, var(--green), #00BF5F)"
                        : undefined,
                    }}
                  />
                </div>
              </div>
            )}

            {done && (
              <div style={{ marginTop: 16 }}>
                <SecurityNotice text="File encrypted and uploaded. Share the drop code with the recipient. File will self-destruct after first download." />
              </div>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        {file && !uploading && !done && (
          <button className="btn-primary" onClick={handleUpload}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="lock" size={18} color="#0B0B0B" />
              ENCRYPT & UPLOAD
            </span>
          </button>
        )}

        {done && (
          <button className="btn-primary" onClick={() => navigate("fileready")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="check" size={18} color="#0B0B0B" />
              VIEW DROP CODE
            </span>
          </button>
        )}

      </div>
    </div>
  );
};

export default FileDropScreen;
