import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { SecurityNotice } from "../components/SharedComponents";
import { useAppContext } from "../context/AppContext";
import { createFileDrop, uploadFileDropWithProgress } from "../api";
import { randomCode, sha256, deriveDropKey, encryptBuffer, hmacHex, base64ToBytes } from "../utils/crypto";
import WebLayout from "../components/WebLayout";

const fmtSize = (b) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`;

const formatDuration = (minutes) => {
  const days  = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins  = minutes % 60;
  const parts = [];
  if (days  > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins  > 0) parts.push(`${mins}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
};

const FileDropScreen = ({ navigate }) => {
  const [dragover,   setDragover]   = useState(false);
  const [file,       setFile]       = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [done,       setDone]       = useState(false);
  const [duration,   setDuration]   = useState("1h");
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customMinutes,    setCustomMinutes]    = useState(10);
  const [dialogDays,       setDialogDays]       = useState(0);
  const [dialogHours,      setDialogHours]      = useState(0);
  const [dialogMinutes,    setDialogMinutes]    = useState(10);
  const { setDrop, showAlert } = useAppContext();

  useEffect(() => {
    if (!showCustomDialog) return;
    const totalMinutes = customMinutes || 0;
    setDialogDays(Math.floor(totalMinutes / 1440));
    setDialogHours(Math.floor((totalMinutes % 1440) / 60));
    setDialogMinutes(totalMinutes % 60);
  }, [showCustomDialog, customMinutes]);

  const handleFile = (f) => { setFile(f); setProgress(0); setDone(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0);
    const dropCode = randomCode();
    const dropHash = await sha256(dropCode);
    try {
      const totalMinutes = duration === "custom" ? customMinutes : duration === "10m" ? 10 : duration === "1h" ? 60 : duration === "24h" ? 24*60 : 10;
      const durationValue = `${totalMinutes}m`;
      const createRes = await createFileDrop(dropHash, durationValue);
      if (!createRes.success) throw new Error(createRes.error || "Failed to create drop");
      const dropKey = await deriveDropKey(dropCode);
      const rawFile = await file.arrayBuffer();
      const { ciphertext, iv, authTag } = await encryptBuffer(dropKey, rawFile);
      const hmac = await hmacHex(dropKey, `${ciphertext}${iv}${authTag}`);
      const encryptedBytes = base64ToBytes(ciphertext);
      const encryptedBlob = new Blob([encryptedBytes], { type: "application/octet-stream" });
      const form = new FormData();
      form.append("dropHash", dropHash); form.append("file", encryptedBlob, file.name);
      form.append("fileName", file.name); form.append("fileSize", String(file.size));
      form.append("iv", iv); form.append("authTag", authTag); form.append("hmac", hmac);
      const uploadRes = await uploadFileDropWithProgress(form, (fraction) => setProgress(Math.round(fraction * 100)));
      setProgress(100);
      if (!uploadRes.success) throw new Error(uploadRes.error || "Upload failed");
      setDrop({ code: dropCode, dropHash, duration, expiryTimestamp: Date.parse(createRes.expiryTimestamp), fileId: uploadRes.fileId, fileName: file.name, fileSize: file.size, iv, authTag, isReceiver: false });
      setDone(true);
    } catch (err) {
      console.error("File drop upload failed", err);
      showAlert("Upload failed: " + (err.message || err), "error");
    } finally { setUploading(false); }
  };

  const reset = () => { setFile(null); setDone(false); setProgress(0); };

  const durationLabel = duration === "10m" ? "10 min" : duration === "1h" ? "1 hour" : duration === "24h" ? "24 hours" : formatDuration(customMinutes);

  return (
    <WebLayout navigate={navigate} currentPage="filedrop">
      <style>{`
        .filedrop-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          max-width: 900px;
        }
        @media (min-width: 820px) {
          .filedrop-grid { grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <button className="back-btn" onClick={() => navigate("home")} style={{ marginBottom: 16 }}>
          <Icon name="arrowLeft" size={16} /> BACK
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Secure <span className="text-yellow">File Drop</span>
          </h2>
          <div className="badge"><Icon name="upload" size={10} color="var(--yellow)" /> FILE DROP</div>
        </div>
        <p className="text-grey" style={{ fontSize: 14, marginTop: 8, marginBottom: 0 }}>
          One-time encrypted file transfer — expires after download
        </p>
      </div>

      <div className="filedrop-grid">

        {/* ── LEFT: drop zone + file preview ── */}
        <div>
          {/* Drop zone */}
          {!file && (
            <label
              className={`drop-zone ${dragover ? "dragover" : ""}`}
              style={{ marginBottom: 24, display: "block" }}
              onDragOver={e => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
            >
              <input type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 64, height: 64,
                  background: "var(--card2)", border: "1px solid var(--border)",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", transition: "all 0.2s",
                }}>
                  <Icon name="upload" size={28} color={dragover ? "var(--yellow)" : "var(--grey)"} />
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                  {dragover ? "Drop to encrypt & upload" : "Drag & drop file here"}
                </div>
                <div className="text-grey" style={{ fontSize: 13 }}>or click to browse files</div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="lock" size={13} color="var(--yellow)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)" }}>AES-256-GCM ENCRYPTION</span>
                </div>
              </div>
            </label>
          )}

          {/* File preview */}
          {file && (
            <div style={{ marginBottom: 20 }}>
              <div className="file-card">
                <div className="file-icon-box">
                  <Icon name="file" size={22} color="var(--yellow)" />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div className="text-grey" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtSize(file.size)}</div>
                </div>
                <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Icon name="x" size={16} color="var(--grey)" />
                </button>
              </div>

              {(uploading || done) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: done ? "var(--green)" : "var(--yellow)" }}>
                      {done ? "ENCRYPTION COMPLETE ✓" : "ENCRYPTING & UPLOADING"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)" }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: done ? "linear-gradient(90deg, var(--green), #00BF5F)" : undefined }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTAs */}
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

        {/* ── RIGHT: settings + security info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Duration picker */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px" }}>
            <div className="label" style={{ marginBottom: 12 }}>Self-Destruct Duration</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["10m", "1h", "24h", "custom"].map((opt) => {
                const label = opt === "10m" ? "10 min" : opt === "1h" ? "1 hour" : opt === "24h" ? "24 hours" : duration === "custom" ? formatDuration(customMinutes) : "Custom";
                return (
                  <button key={opt} className={`timer-pill ${duration === opt ? "active" : ""}`}
                    onClick={() => { if (opt === "custom") { setDuration("custom"); setShowCustomDialog(true); } else { setDuration(opt); } }}>
                    {label}
                  </button>
                );
              })}
            </div>
            {duration === "custom" && !showCustomDialog && (
              <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--grey)" }}>
                Custom: {formatDuration(customMinutes)}
              </div>
            )}
          </div>

          <SecurityNotice text="File is encrypted client-side using AES-256-GCM before upload. The server never sees the plaintext. File self-destructs after download or expiry." />

          {/* How it works */}
          <div style={{ padding: "18px 20px", background: "rgba(245,196,0,0.04)", border: "1px solid rgba(245,196,0,0.15)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", letterSpacing: "1px", marginBottom: 12 }}>HOW IT WORKS</div>
            {[
              "Drop your file into the upload zone",
              "File is encrypted locally in your browser",
              "Share the generated drop code or QR",
              "Recipient downloads & decrypts once",
              "File is permanently deleted after download",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(245,196,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--yellow)" }}>{i + 1}</span>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)", lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Custom duration dialog */}
      {showCustomDialog && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:9999 }}>
          <div style={{ width:"100%", maxWidth:460, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:16, padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:700 }}>Custom duration</div>
              <button style={{ background:"none", border:"none", color:"var(--grey)", cursor:"pointer", fontSize:18 }} onClick={() => setShowCustomDialog(false)}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {[{ label:"Days", value:dialogDays, setValue:setDialogDays, max:5 }, { label:"Hours", value:dialogHours, setValue:setDialogHours, max:23 }, { label:"Minutes", value:dialogMinutes, setValue:setDialogMinutes, max:59 }].map(({ label, value, setValue, max }) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:12, color:"var(--grey)", marginBottom:8 }}>{label}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <button onClick={() => setValue(Math.max(0, value - 1))} disabled={value <= 0} style={{ width:32, height:32, borderRadius:10, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"var(--grey)", cursor:value>0?"pointer":"not-allowed" }}>−</button>
                    <div style={{ minWidth:34, textAlign:"center", fontFamily:"var(--font-mono)", fontSize:14, color:"var(--white)" }}>{value}</div>
                    <button onClick={() => setValue(Math.min(max, value + 1))} disabled={value >= max} style={{ width:32, height:32, borderRadius:10, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"var(--grey)", cursor:value<max?"pointer":"not-allowed" }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:20 }}>
              <button className="btn-secondary" onClick={() => setShowCustomDialog(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { const totalMinutes = dialogDays*24*60+dialogHours*60+dialogMinutes; if (totalMinutes<1) { showAlert("Duration must be at least 1 minute", "warning"); return; } setCustomMinutes(totalMinutes); setDuration("custom"); setShowCustomDialog(false); }}>Set</button>
            </div>
          </div>
        </div>
      )}
    </WebLayout>
  );
};

export default FileDropScreen;