import { useState } from "react";
import Icon from "../components/Icon";
import { SecurityNotice } from "../components/SharedComponents";
import { validateDrop } from "../api";
import { sha256 } from "../utils/crypto";
import { useAppContext } from "../context/AppContext";

const ReceiveFileScreen = ({ navigate }) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [validated, setValidated] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const { setDrop } = useAppContext();

  const handleValidate = async () => {
    if (!/^[0-9]{6}$/.test(code)) {
      alert("Please enter a 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      const dropHash = await sha256(code);
      const res = await validateDrop(dropHash);
      if (!res.success) {
        throw new Error(res.error || "Invalid drop code");
      }

      setFileInfo(res);
      setValidated(true);
      setDrop({
        code,
        dropHash,
        fileId: res.fileId,
        fileName: res.fileName,
        fileSize: res.fileSize,
        expiryTimestamp: Date.parse(res.expiryTime),
      });
    } catch (err) {
      console.error("Validate drop failed", err);
      alert("Failed to validate code: " + (err.message || err));
    } finally {
      setVerifying(false);
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
          <input
            className="input-field"
            placeholder="123456"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            style={{ width: "100%" }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleValidate}
          disabled={verifying || code.length !== 6}
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
              <button className="btn-primary" onClick={() => navigate("fileready")}> 
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="download" size={18} color="#0B0B0B" />
                  DECRYPT & DOWNLOAD
                </span>
              </button>
              <button className="btn-secondary" onClick={() => navigate("home")}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="x" size={16} color="var(--yellow)" />
                  REJECT FILE
                </span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ReceiveFileScreen;
