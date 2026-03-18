import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr/dist/jsQR";
import Icon from "../components/Icon";
import { joinRoom } from "../api";
import { useAppContext } from "../context/AppContext";
import { addRecentRoom } from "../utils/recentRooms";

const JoinRoomScreen = ({ navigate }) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [joining, setJoining] = useState(false);
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

  useEffect(() => {
    const prefill = localStorage.getItem("securecore:prefill_code");
    if (prefill && /^[0-9]{6}$/.test(prefill)) {
      setDigits(prefill.split("").concat(Array(6).fill("")).slice(0, 6));
      localStorage.removeItem("securecore:prefill_code");
    }
  }, []);
  const setDigitsFromCode = (raw) => {
    if (!raw) return null;

    // Some QR payloads are JSON objects (mobile app), while others are raw codes.
    // Prefer JSON parsing to support cross-platform compatibility.
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.type === "secure_room" && typeof parsed?.code === "string") {
        raw = parsed.code;
      }
    } catch {
      // Not JSON; fall back to raw string
    }

    const digitsOnly = raw.replace(/\D/g, "").slice(0, 6);
    if (digitsOnly.length !== 6) return null;
    const arr = digitsOnly.split("").concat(Array(6).fill(""))?.slice(0, 6);
    setDigits(arr);
    return digitsOnly;
  };

  const joinWithCode = async (code) => {
    const digitsOnly = setDigitsFromCode(code);
    if (!digitsOnly) return;

    setJoining(true);
    try {
      const res = await joinRoom(digitsOnly);
      if (!res.success) throw new Error(res.error || "Invalid room code");

      setRoom({
        code: res.room_code || digitsOnly,
        roomHash: res.room_hash,
        roomSalt: res.room_salt,
        expiryTimestamp: res.expiry_timestamp,
        creatorId: res.creator_id,
      });

      addRecentRoom({ code: digitsOnly, roomHash: res.room_hash, expiryTimestamp: res.expiry_timestamp });
      navigate("chat");
    } catch (err) {
      console.error("Join failed", err);
      alert("Unable to join room: " + (err.message || err));
    } finally {
      setJoining(false);
    }
  };


  const handleUpload = async (file) => {
    if (!file) return;

    try {
      // Use createImageBitmap for faster, more reliable image decoding (esp. large images)
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
        joinWithCode(code.data);
      } else {
        alert("No QR code found in image.");
      }
    } catch (err) {
      console.error("QR upload error", err);
      alert("Unable to read QR image: " + (err?.message || err));
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

      addRecentRoom({ code, roomHash: res.room_hash, expiryTimestamp: res.expiry_timestamp });
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
          Enter your 6-digit access code or upload QR
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
