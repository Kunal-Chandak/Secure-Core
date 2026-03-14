import { useState, useRef } from "react";
import Icon from "../components/Icon";
import { joinRoom } from "../api";
import { useAppContext } from "../context/AppContext";

const JoinRoomScreen = ({ navigate }) => {
  const [digits,   setDigits]   = useState(["", "", "", "", "", ""]);
  const [scanning, setScanning] = useState(false);
  const [joining,  setJoining]  = useState(false);
  const inputRefs = useRef([]);
  const { setRoom } = useAppContext();

  const isComplete = digits.every(d => d !== "");

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
      setDigits(pasted.split("").concat(Array(6).fill("")).slice(0, 6));
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleJoin = async () => {
    const code = digits.join("");
    if (code.length !== 6) return;

    setJoining(true);
    try {
      const res = await joinRoom(code);
      if (!res.success) {
        throw new Error(res.error || "Invalid room code");
      }

      setRoom({
        code: res.room_code || code,
        roomHash: res.room_hash,
        roomSalt: res.room_salt,
        expiryTimestamp: res.expiry_timestamp,
        creatorId: res.creator_id,
      });

      navigate("chat");
    } catch (err) {
      console.error("Join failed", err);
      alert("Unable to join room: " + (err.message || err));
    } finally {
      setJoining(false);
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
            <Icon name="lock" size={10} color="var(--yellow)" /> JOIN ROOM
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 6 }}>
          Join <span className="text-yellow">Secure Room</span>
        </h2>
        <p className="text-grey" style={{ fontSize: 14, marginBottom: 32 }}>
          Enter your 6-digit access code or scan QR
        </p>

        {/* ── Code input ── */}
        <div style={{ marginBottom: 32 }}>
          <div className="label">Access Code</div>
          <div className="code-input-group" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                className="code-input-digit"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
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

        {/* ── QR options ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>

          {/* Scan */}
          <div
            className="card"
            style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer", borderColor: scanning ? "var(--yellow)" : "var(--border)" }}
            onClick={() => setScanning(s => !s)}
          >
            <div style={{
              width: 48, height: 48,
              background: scanning ? "var(--yellow-dim)" : "var(--card2)",
              border: `1px solid ${scanning ? "rgba(245,196,0,0.5)" : "var(--border)"}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
              animation: scanning ? "qrPulse 1.5s ease-in-out infinite" : "none",
            }}>
              <Icon name="camera" size={22} color={scanning ? "var(--yellow)" : "var(--grey)"} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Scan QR</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)" }}>Camera scanner</div>
          </div>

          {/* Upload */}
          <label className="card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} />
            <div style={{ width: 48, height: 48, background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Icon name="upload" size={22} color="var(--grey)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Upload QR</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)" }}>From gallery</div>
          </label>
        </div>

        {/* ── Scanner viewport ── */}
        {scanning && (
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{ background: "var(--card2)", border: "2px solid var(--yellow)", borderRadius: 12, padding: 24, position: "relative" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--yellow)", marginBottom: 8 }}>SCANNING...</div>
              <div style={{ width: "100%", height: 180, background: "var(--card)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <Icon name="qr" size={60} color="rgba(245,196,0,0.3)" />
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent, var(--yellow), transparent)",
                  animation: "scanLine 2s ease-in-out infinite",
                }} />
              </div>
              <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--grey)" }}>
                Point camera at QR code
              </div>
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleJoin}
          disabled={!isComplete || joining}
        >
          {joining ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#0B0B0B" }} />
              CONNECTING SECURELY...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="lock" size={18} color="#0B0B0B" />
              JOIN ROOM
            </span>
          )}
        </button>

      </div>
    </div>
  );
};

export default JoinRoomScreen;
