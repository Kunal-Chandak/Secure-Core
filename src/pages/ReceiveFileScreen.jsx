import { useState, useRef } from "react";
import jsQR from "jsqr/dist/jsQR";
import Icon from "../components/Icon";
import { SecurityNotice } from "../components/SharedComponents";
import { validateDrop, downloadFileDropWithProgress } from "../api";
import { sha256, deriveDropKey, decryptBufferRaw } from "../utils/crypto";
import { useAppContext } from "../context/AppContext";

const ReceiveFileScreen = ({ navigate }) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [validated, setValidated] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [dropHash, setDropHash] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [downloaded, setDownloaded] = useState(false);

  const inputRefs = useRef([]);
  const { setDrop } = useAppContext();

  const code = digits.join("");
  const isComplete = digits.every((d) => d !== "");

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setDigits(pasted.split("").concat(Array(6).fill(""))?.slice(0, 6));
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const setDigitsFromCode = (raw) => {
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === "secure_drop" && typeof parsed?.code === "string") {
        raw = parsed.code;
      }
    } catch {
      // Not JSON; fall back to raw string
    }

    const digitsOnly = raw.replace(/\D/g, "").slice(0, 6);
    if (digitsOnly.length !== 6) return null;

    setDigits(digitsOnly.split("").concat(Array(6).fill(""))?.slice(0, 6));
    return digitsOnly;
  };

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        const digitsOnly = setDigitsFromCode(code.data);
        if (digitsOnly) {
          setTimeout(() => handleValidate(), 100);
        }
      } else {
        alert("No QR code found in image.");
      }
    } catch (err) {
      console.error("QR upload error", err);
      alert("Unable to read QR image: " + (err?.message || err));
    }
  };

  const handleValidate = async () => {
    if (!isComplete) {
      alert("Please enter a 6-digit code");
      return;
    }

    setVerifying(true);
    setStatusMessage("");
    setDownloaded(false);
    setDownloadProgress(0);

    try {
      const hash = await sha256(code);
      const res = await validateDrop(hash);
      if (!res.success) {
        throw new Error(res.error || "Invalid drop code");
      }

      setFileInfo(res);
      setDropHash(hash);
      setValidated(true);
      setDrop({
        code,
        dropHash: hash,
        fileId: res.fileId,
        fileName: res.fileName,
        fileSize: res.fileSize,
        expiryTimestamp: Date.parse(res.expiryTime),
        iv: res.iv,
        authTag: res.authTag,
        isReceiver: true,
      });
    } catch (err) {
      console.error("Validate drop failed", err);
      alert("Failed to validate code: " + (err.message || err));
    } finally {
      setVerifying(false);
    }
  };

  const downloadAndDecrypt = async () => {
    if (!fileInfo || !dropHash) return;

    setDownloading(true);
    setStatusMessage("Downloading encrypted file...");
    setDownloadProgress(0);

    try {
      const { arrayBuffer, headers } = await downloadFileDropWithProgress(
        fileInfo.fileId,
        dropHash,
        (p) => setDownloadProgress(p),
      );

      const iv = headers["x-file-iv"];
      const authTag = headers["x-file-authtag"];
      const fileNameHeader = headers["x-file-filename"];
      const fileName = fileNameHeader || fileInfo.fileName || "downloaded_file";

      if (!iv || !authTag) {
        throw new Error("Missing encryption metadata from server");
      }

      setStatusMessage("Decrypting file...");
      const key = await deriveDropKey(code);
      const ciphertext = new Uint8Array(arrayBuffer);
      const plaintext = await decryptBufferRaw(key, ciphertext, iv, authTag);

      // Trigger browser download
      const blob = new Blob([plaintext], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatusMessage("File downloaded and decrypted successfully.");
      setDownloaded(true);
    } catch (err) {
      console.error("Download/decrypt failed", err);
      alert("Download failed: " + (err.message || err));
      setStatusMessage("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Nav */}
        <div className="nav-header">
          <button className="back-btn" onClick={() => navigate("home")}> 
            <Icon name="arrowLeft" size={16} /> BACK
          </button>
          <div className="badge">
            <Icon name="download" size={10} color="var(--yellow)" /> RECEIVE
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 6 }}>
          Receive <span className="text-yellow">Secure File</span>
        </h2>
        <p className="text-grey" style={{ fontSize: 14, marginBottom: 28 }}>
          Enter your drop code to retrieve encrypted file
        </p>

        <div style={{ marginBottom: 20 }}>
          <div className="label">Drop Code</div>
          <div className="code-input-group" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="code-input-digit"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                inputMode="numeric"
              />
            ))}
          </div>
        </div>

        {/* ── OR divider ── */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div className="divider" />
          <span style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: "var(--bg)", padding: "0 12px",
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey-dim)",
          }}>OR</span>
        </div>

        {/* ── QR upload ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <label className="card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <div style={{ width: 48, height: 48, background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Icon name="upload" size={22} color="var(--grey)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Upload QR</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)" }}>From gallery</div>
          </label>
        </div>

        <button
          className="btn-primary"
          onClick={handleValidate}
          disabled={verifying || !isComplete}
        >
          {verifying ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#0B0B0B" }} />
              VERIFYING...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="shield" size={18} color="#0B0B0B" />
              VERIFY DROP
            </span>
          )}
        </button>

        {validated && fileInfo && (
          <>
            <div className="card card-glow" style={{ padding: 20, marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="file-icon-box" style={{ width: 52, height: 52 }}>
                  <Icon name="file" size={24} color="var(--yellow)" />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {fileInfo.fileName}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="badge" style={{ fontSize: 10 }}>
                      {fileInfo.fileSize ? `${Math.round(fileInfo.fileSize / 1024)} KB` : ""}
                    </span>
                    <span className="badge green" style={{ fontSize: 10 }}>
                      <Icon name="check" size={9} color="var(--green)" /> VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>Expires</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--white)" }}>
                    {fileInfo.timeRemaining ? `${Math.floor(fileInfo.timeRemaining / 60)}m` : ""}
                  </div>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 3 }}>HMAC</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--white)" }}>
                    SHA-256
                  </div>
                </div>
              </div>
            </div>

            <SecurityNotice text="This file's integrity has been verified using HMAC-SHA256. Decryption happens locally in your browser. No keys are ever transmitted." />

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button
                className="btn-primary"
                onClick={downloadAndDecrypt}
                disabled={downloading || downloaded}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {downloading && (
                    <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#0B0B0B" }} />
                  )}
                  <Icon name="download" size={18} color="#0B0B0B" />
                  {downloaded ? "DOWNLOADED" : "DECRYPT & DOWNLOAD"}
                </span>
              </button>
              <button className="btn-secondary" onClick={() => navigate("home")}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="x" size={16} color="var(--yellow)" />
                  REJECT FILE
                </span>
              </button>
            </div>

            {statusMessage && (
              <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--grey)" }}>
                {statusMessage}
              </div>
            )}

            {downloading && (
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${Math.round(downloadProgress * 100)}%` }} />
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default ReceiveFileScreen;
