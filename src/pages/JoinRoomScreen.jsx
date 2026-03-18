import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr/dist/jsQR";
import Icon from "../components/Icon";
import { joinRoom } from "../api";
import { useAppContext } from "../context/AppContext";
import { addRecentRoom } from "../utils/recentRooms";
import WebLayout from "../components/WebLayout";

const JoinRoomScreen = ({ navigate }) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [joining, setJoining] = useState(false);
  const inputRefs = useRef([]);
  const { setRoom, showAlert } = useAppContext();
  const isComplete = digits.every(d => d !== "");

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setDigits(pasted.split("").concat(Array(6).fill("")).slice(0, 6));
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  useEffect(() => {
    const prefill = localStorage.getItem("securecore:prefill_code");
    if (prefill && /^[0-9]{6}$/.test(prefill)) {
      setDigits(prefill.split("").concat(Array(6).fill("")).slice(0, 6));
      localStorage.removeItem("securecore:prefill_code");
    }
  }, []);

  const setDigitsFromCode = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === "secure_room" && typeof parsed?.code === "string") raw = parsed.code;
    } catch { /* not JSON */ }
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 6);
    if (digitsOnly.length !== 6) return null;
    setDigits(digitsOnly.split("").concat(Array(6).fill("")).slice(0, 6));
    return digitsOnly;
  };

  const joinWithCode = async (code) => {
    const digitsOnly = setDigitsFromCode(code);
    if (!digitsOnly) return;
    setJoining(true);
    try {
      const res = await joinRoom(digitsOnly);
      if (!res.success) throw new Error(res.error || "Invalid room code");
      setRoom({ code: res.room_code || digitsOnly, roomHash: res.room_hash, roomSalt: res.room_salt, expiryTimestamp: res.expiry_timestamp, creatorId: res.creator_id });
      addRecentRoom({ code: digitsOnly, roomHash: res.room_hash, expiryTimestamp: res.expiry_timestamp });
      navigate("chat");
    } catch (err) {
      showAlert("Unable to join room: " + (err.message || err), "error");
    } finally {
      setJoining(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0); bitmap.close();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) joinWithCode(code.data);
      else showAlert("No QR code found in image.", "warning");
    } catch (err) {
      showAlert("Unable to read QR image: " + (err?.message || err), "error");
    }
  };

  const handleJoin = async () => {
    const code = digits.join("");
    if (code.length !== 6) return;
    setJoining(true);
    try {
      const res = await joinRoom(code);
      if (!res.success) throw new Error(res.error || "Invalid room code");
      setRoom({ code: res.room_code || code, roomHash: res.room_hash, roomSalt: res.room_salt, expiryTimestamp: res.expiry_timestamp, creatorId: res.creator_id });
      addRecentRoom({ code, roomHash: res.room_hash, expiryTimestamp: res.expiry_timestamp });
      navigate("chat");
    } catch (err) {
      showAlert("Unable to join room: " + (err.message || err), "error");
    } finally {
      setJoining(false);
    }
  };

  return (
    <WebLayout navigate={navigate} currentPage="join">
      <style>{`
        .join-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          max-width: 820px;
        }
        @media (min-width: 820px) {
          .join-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <button className="back-btn" onClick={() => navigate("home")} style={{ marginBottom: 16 }}>
          <Icon name="arrowLeft" size={16} /> BACK
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Join <span className="text-yellow">Secure Room</span>
          </h2>
          <div className="badge"><Icon name="lock" size={10} color="var(--yellow)" /> JOIN ROOM</div>
        </div>
        <p className="text-grey" style={{ fontSize: 14, marginTop: 8, marginBottom: 0 }}>
          Enter your 6-digit access code or upload a QR code
        </p>
      </div>

      <div className="join-grid">

        {/* ── LEFT: code entry ── */}
        <div>
          <div style={{ marginBottom: 28 }}>
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

          <button className="btn-primary" onClick={handleJoin} disabled={!isComplete || joining}>
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

        {/* ── RIGHT: QR upload + info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", display: "block" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
            <div style={{
              width: 56, height: 56, background: "var(--card2)",
              border: "1px solid var(--border)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            }}>
              <Icon name="upload" size={24} color="var(--grey)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Upload QR Code</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--grey)" }}>Select from your gallery or files</div>
          </label>

          <div style={{
            padding: "16px 20px",
            background: "rgba(245,196,0,0.04)",
            border: "1px solid rgba(245,196,0,0.15)",
            borderRadius: 12,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--yellow)", letterSpacing: "1px", marginBottom: 10 }}>
              HOW IT WORKS
            </div>
            {[
              "Get a 6-digit code from the room creator",
              "Enter the code above or scan their QR",
              "Connect with end-to-end encryption",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(245,196,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--yellow)" }}>{i + 1}</span>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--grey)", lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </WebLayout>
  );
};

export default JoinRoomScreen;