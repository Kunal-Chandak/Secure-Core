import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { useAppContext } from "../context/AppContext";
import { connectWS } from "../utils/ws";
import { burnRoom, getRoomInfo, getRoomMessages, uploadChatFile, downloadChatFile } from "../api";
import {
  base64ToBytes,
  base64ToUtf8,
  deriveRoomKey,
  decryptBufferRaw,
  decryptMessage,
  encryptBuffer,
  encryptMessage,
  hmacHex,
} from "../utils/crypto";

const SIDEBAR_WIDTH = 220; // must match WebLayout sidebar width

const fmtCountdown = (s) => {
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (h > 0)
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
};

const guessMimeType = (fileName) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const map = {
    jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png",
    gif:"image/gif",  webp:"image/webp",
    mp4:"video/mp4",  mov:"video/quicktime",
    pdf:"application/pdf", txt:"text/plain",
    json:"application/json", zip:"application/zip",
  };
  return map[ext] || "application/octet-stream";
};

/* ─── CONNECTION PILL ─── */
const ConnectionPill = ({ open }) => (
  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
    <div style={{
      width:6, height:6, borderRadius:"50%",
      background: open ? "var(--green)" : "var(--red)",
      boxShadow: `0 0 6px ${open ? "var(--green)" : "var(--red)"}`,
      animation: open ? "pulseDot 1.5s ease-in-out infinite" : "none",
    }} />
    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.5px", color: open ? "var(--green)" : "var(--red)" }}>
      {open ? "LIVE" : "OFFLINE"}
    </span>
  </div>
);

/* ─── BURN CONFIRM DIALOG ─── */
const BurnDialog = ({ onConfirm, onCancel }) => (
  <div style={{
    position:"fixed", inset:0, zIndex:999,
    background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)",
    display:"flex", alignItems:"center", justifyContent:"center",
    padding:"0 24px", animation:"fadeIn 0.15s ease",
  }}>
    <div style={{
      width:"100%", maxWidth:360,
      background:"var(--deep-black, #0B0B0B)",
      border:"1.5px solid rgba(245,196,0,0.6)",
      borderRadius:20, padding:"24px 24px 28px",
      boxShadow:"0 0 40px rgba(245,196,0,0.15), 0 20px 60px rgba(0,0,0,0.8)",
      animation:"scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,59,59,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:28, lineHeight:1 }}>🔥</span>
        </div>
      </div>
      <div style={{ textAlign:"center", marginBottom:10, fontFamily:"var(--font-display)", fontWeight:700, fontSize:20, color:"var(--yellow)" }}>
        Burn Room?
      </div>
      <div style={{ textAlign:"center", marginBottom:24, fontFamily:"var(--font-body)", fontSize:14, lineHeight:1.5, color:"var(--white)", opacity:0.8 }}>
        This will permanently destroy the room and all messages. This action cannot be undone.
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"12px 0", borderRadius:12, cursor:"pointer", background:"transparent", border:"1px solid rgba(245,196,0,0.6)", color:"var(--yellow)", fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(245,196,0,0.08)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>Cancel</button>
        <button onClick={onConfirm} style={{ flex:1, padding:"12px 0", borderRadius:12, cursor:"pointer", background:"var(--red, #FF3B3B)", border:"none", color:"#fff", fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, transition:"all 0.2s", boxShadow:"0 4px 18px rgba(255,59,59,0.35)" }}
          onMouseEnter={e => e.currentTarget.style.opacity="0.88"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>Burn</button>
      </div>
    </div>
  </div>
);

/* ─── UPLOADING BUBBLE ─── */
const UploadingBubble = ({ fileName, progress, sent }) => {
  const bg    = sent ? "rgba(0,0,0,0.15)" : "var(--yellow-dim)";
  const acct  = sent ? "#0B0B0B"          : "var(--yellow)";
  const muted = sent ? "rgba(0,0,0,0.4)"  : "var(--grey)";
  const bar   = sent ? "rgba(0,0,0,0.4)"  : "linear-gradient(90deg,var(--yellow),#FFE066)";
  const track = sent ? "rgba(0,0,0,0.12)" : "var(--card2)";
  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`} style={{ minWidth:220, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background:bg, border:`1px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border-hover)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="upload" size={16} color={acct} />
        </div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color: sent ? "#0B0B0B" : "var(--white)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fileName}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:muted, marginTop:2 }}>ENCRYPTING & UPLOADING…</div>
        </div>
      </div>
      <div style={{ height:3, borderRadius:2, background:track, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:2, width:`${progress ?? 40}%`, background:bar, transition:"width 0.3s ease", boxShadow: sent ? "none" : "0 0 6px var(--yellow-glow)" }} />
      </div>
    </div>
  );
};

/* ─── FILE BUBBLE ─── */
const FileBubble = ({ msg, sent, onDownload, downloading }) => {
  const bg    = sent ? "rgba(0,0,0,0.15)" : "var(--yellow-dim)";
  const acct  = sent ? "#0B0B0B"          : "var(--yellow)";
  const muted = sent ? "rgba(0,0,0,0.5)"  : "var(--grey)";
  const dlBg  = sent ? "rgba(0,0,0,0.2)"  : "var(--card)";
  const dlHov = sent ? "rgba(0,0,0,0.35)" : "var(--yellow-dim)";
  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`} style={{ minWidth:220, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:8, flexShrink:0, background:bg, border:`1px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border-hover)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="file" size={18} color={acct} />
        </div>
        <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color: sent ? "#0B0B0B" : "var(--white)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{msg.fileName || "Attachment"}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:muted }}>ENCRYPTED FILE</div>
        </div>
        <button onClick={() => onDownload(msg.fileId, msg.fileName)} disabled={downloading}
          style={{ width:34, height:34, borderRadius:8, border:"none", background:dlBg, cursor: downloading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s", opacity: downloading ? 0.5 : 1 }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = dlHov; }} onMouseLeave={e => { e.currentTarget.style.background = dlBg; }}>
          {downloading
            ? <div style={{ width:14, height:14, border:`2px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border)"}`, borderTopColor:acct, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            : <Icon name="download" size={15} color={acct} />}
        </button>
      </div>
    </div>
  );
};

/* ─── IMAGE BUBBLE ─── */
const ImageBubble = ({ msg, sent, onDownload, downloading }) => {
  const acct   = sent ? "#0B0B0B" : "var(--yellow)";
  const btnBg  = sent ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.05)";
  const skBg   = sent ? "rgba(0,0,0,0.15)" : "var(--card2)";
  const skText = sent ? "rgba(0,0,0,0.4)"  : "var(--grey-dim)";
  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`} style={{ padding:8, minWidth:200 }}>
      {msg.previewUrl ? (
        <img src={msg.previewUrl} alt={msg.fileName || "image"} style={{ display:"block", maxWidth:240, width:"100%", borderRadius:10, marginBottom:6 }} />
      ) : (
        <div style={{ width:240, height:150, borderRadius:10, marginBottom:6, background:skBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, border:`1px solid ${sent ? "rgba(0,0,0,0.1)" : "var(--border)"}` }}>
          <Icon name="camera" size={28} color={skText} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:skText }}>{msg.uploading ? "UPLOADING…" : "LOADING…"}</span>
        </div>
      )}
      <button onClick={() => onDownload(msg.fileId, msg.fileName)} disabled={downloading}
        style={{ width:"100%", border:"none", background:btnBg, color:acct, borderRadius:6, padding:"7px 10px", fontFamily:"var(--font-mono)", fontSize:11, cursor: downloading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s", opacity: downloading ? 0.6 : 1 }}>
        {downloading
          ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:"currentColor", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> DOWNLOADING…</>
          : <><Icon name="download" size={12} color="currentColor" /> VIEW / SAVE</>}
      </button>
    </div>
  );
};

/* ─── ATTACH MENU ─── */
const AttachMenu = ({ onFile, onImage, onClose }) => (
  <>
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9 }} />
    <div style={{
      position:"absolute", bottom:"calc(100% + 10px)", left:0,
      background:"rgba(13,13,13,0.98)", border:"1px solid var(--border-hover)",
      borderRadius:12, padding:8, zIndex:10, width:210,
      boxShadow:"0 0 24px rgba(245,196,0,0.15), 0 12px 40px rgba(0,0,0,0.7)",
      animation:"fadeSlideIn 0.18s ease forwards",
    }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey-dim)", letterSpacing:"1.5px", padding:"4px 10px 8px" }}>
        // ATTACH
      </div>
      {[{ icon:"camera", label:"Photo / Camera", action:onImage }, { icon:"file", label:"Choose File", action:onFile }].map(item => (
        <button key={item.label} onClick={item.action}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:8, border:"none", background:"transparent", color:"var(--white)", fontFamily:"var(--font-body)", fontSize:14, cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}
          onMouseEnter={e => { e.currentTarget.style.background="var(--yellow-dim)"; e.currentTarget.style.color="var(--yellow)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--white)"; }}>
          <div style={{ width:30, height:30, borderRadius:6, background:"var(--card2)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name={item.icon} size={14} color="var(--yellow)" />
          </div>
          {item.label}
        </button>
      ))}
    </div>
  </>
);

/* ─── UPLOAD BAR ─── */
const UploadBar = ({ progress }) => (
  <div style={{ marginBottom:8 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--yellow)", animation:"pulseDot 1s infinite", boxShadow:"0 0 6px var(--yellow-glow)" }} />
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--yellow)", letterSpacing:"0.5px" }}>ENCRYPTING & UPLOADING</span>
      </div>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey)" }}>{Math.round(progress)}%</span>
    </div>
    <div className="progress-bar" style={{ height:3 }}>
      <div className="progress-fill" style={{ width:`${progress}%` }} />
    </div>
  </div>
);

/* ─── EMPTY STATE ─── */
const EmptyState = () => (
  <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, opacity:0.45, paddingTop:60 }}>
    <div style={{ width:60, height:60, borderRadius:16, background:"var(--yellow-dim)", border:"1px solid var(--border-hover)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Icon name="lock" size={28} color="var(--yellow)" className="enc-lock" />
    </div>
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--grey)", letterSpacing:"0.5px", marginBottom:4 }}>SECURE CHANNEL READY</div>
      <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--grey-dim)" }}>Messages appear here once sent</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ChatRoomScreen = ({ navigate }) => {
  const { clientId, room, setRoom, settings, showAlert } = useAppContext();
  const { messageTimestamps, showSenderIds } = settings;

  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [seconds,         setSeconds]         = useState(0);
  const [wsOpen,          setWsOpen]          = useState(false);
  const [showBurnDialog,  setShowBurnDialog]  = useState(false);
  const [uploadingFile,   setUploadingFile]   = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [downloadingFiles,setDownloadingFiles]= useState({});
  const [showAttachMenu,  setShowAttachMenu]  = useState(false);
  const [roomKey,         setRoomKey]         = useState(null);

  const wsRef        = useRef(null);
  const messagesEnd  = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef= useRef(null);

  const shortenId = (id) => id ? `${id.slice(0,4)}…${id.slice(-4)}` : "";

  /* ── derive room key ── */
  useEffect(() => {
    if (!room?.code || !room?.roomSalt) return;
    deriveRoomKey(room.code, room.roomSalt).then(setRoomKey).catch(console.error);
  }, [room?.code, room?.roomSalt]);

  /* ── countdown timer ── */
  useEffect(() => {
    if (!room?.expiryTimestamp) return;
    const getMs = () => typeof room.expiryTimestamp === "number" ? room.expiryTimestamp : Date.parse(room.expiryTimestamp) || Date.now();
    const tick = () => setSeconds(Math.max(0, Math.floor((getMs() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [room?.expiryTimestamp]);

  /* ── download + decrypt a file ── */
  const downloadAndDecryptFile = useCallback(async (fileId, fileName) => {
    if (!roomKey || !fileId) return null;
    try {
      const { arrayBuffer, headers } = await downloadChatFile(fileId, room.roomHash);
      const iv      = headers["x-file-iv"];
      const authTag = headers["x-file-authtag"];
      if (!iv || !authTag) throw new Error("Missing encryption metadata");
      const ciphertext = new Uint8Array(arrayBuffer);
      const plaintext  = await decryptBufferRaw(roomKey, ciphertext, iv, authTag);
      const mime = guessMimeType(fileName);
      const blob = new Blob([plaintext], { type: mime });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Download/decrypt failed", err);
      return null;
    }
  }, [roomKey, room?.roomHash]);

  /* ── burn room ── */
  const handleBurnRoom = async () => {
    if (!room?.roomHash) return;
    try {
      const res = await burnRoom(room.roomHash, clientId);
      if (res.success) { setRoom(null); navigate("home"); }
      else showAlert("Unable to burn room: " + (res.error || "unknown"), "error");
    } catch (err) { showAlert("Error: " + err.message, "error"); }
  };

  /* ── handle file selection for upload ── */
  const handleFileSelected = async (e, isImage) => {
    const file = e.target.files?.[0];
    if (!file || !roomKey) return;
    setShowAttachMenu(false);
    setUploadingFile(true);
    setUploadProgress(0);

    const tmpId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tmpId, senderId: clientId, text: file.name, fileName: file.name,
      type: isImage ? "image" : "file", sent: true, uploading: true,
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
    }]);

    const timer = setInterval(() => setUploadProgress(p => Math.min(p + 8, 90)), 200);
    try {
      const ab = await file.arrayBuffer();
      const { ciphertext, iv, authTag } = await encryptBuffer(roomKey, new Uint8Array(ab));

      // Server expects raw encrypted bytes in the uploaded file; we send the decoded bytes.
      const encryptedBytes = base64ToBytes(ciphertext);
      const blob = new Blob([encryptedBytes], { type: "application/octet-stream" });

      // Build multipart form data for server upload (multer expects form fields)
      const form = new FormData();
      form.append("file", blob, file.name);
      form.append("fileName", file.name);
      form.append("fileSize", String(file.size));
      form.append("roomHash", room.roomHash);
      form.append("iv", iv);
      form.append("authTag", authTag);

      // HMAC must match server expectations (ciphertextBase64 + iv + authTag)
      const hmac = await hmacHex(roomKey, `${ciphertext}${iv}${authTag}`);
      form.append("hmac", hmac);

      const { fileId } = await uploadChatFile(form);
      setUploadProgress(100);

      const newMsg = {
        id: tmpId, senderId: clientId, text: file.name, fileName: file.name, fileId,
        type: isImage ? "image" : "file", sent: true, uploading: false,
        time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      };
      setMessages(prev => {
        const idx = prev.findIndex(m => m.fileId && m.fileId === fileId);
        if (idx >= 0) { const n=[...prev]; n[idx]={...n[idx],...newMsg}; return n; }
        return [...prev, newMsg];
      });
      downloadAndDecryptFile(fileId, file.name)
        .then(url => url && setMessages(prev => prev.map(m => m.fileId === fileId ? { ...m, previewUrl:url } : m)))
        .catch(() => {});

      wsRef.current?.send(JSON.stringify({
        type: isImage ? "image" : "file",
        roomHash:room.roomHash, senderId:clientId, fileId, fileName:file.name,
      }));
    } catch (err) {
      console.error("Upload failed", err);
      showAlert("Upload failed: " + (err.message || err), "error");
    } finally {
      clearInterval(timer);
      setUploadProgress(0);
      setUploadingFile(false);
    }
  };

  /* ── WebSocket ── */
  useEffect(() => {
    if (!room?.roomHash || !roomKey) return;
    const ws = connectWS(room.roomHash, clientId);
    wsRef.current = ws;
    ws.onopen  = () => setWsOpen(true);
    ws.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "burn") { setRoom(null); navigate("home"); return; }
        if (data.type === "file" || data.type === "image") {
          const { fileId, fileName } = data;
          if (!fileId) return;
          const newMsg = {
            id: data.msgId || Date.now(), senderId: data.senderId,
            type: data.type, fileName, fileId, sent: data.senderId === clientId,
            time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
          };
          setMessages(prev => {
            const idx = prev.findIndex(m => m.fileId && m.fileId === fileId);
            if (idx >= 0) { const n=[...prev]; n[idx]={...n[idx],...newMsg}; return n; }
            return [...prev, newMsg];
          });
          downloadAndDecryptFile(fileId, fileName)
            .then(url => url && setMessages(prev => prev.map(m => m.fileId === fileId ? { ...m, previewUrl:url } : m)))
            .catch(() => {});
          return;
        }
        if (data.ciphertext && data.senderId) {
          if (data.senderId === clientId) return;
          const text = await decryptMessage(roomKey, data.ciphertext, data.iv, data.authTag);
          setMessages(prev => [...prev, {
            id: data.msgId || Date.now(), senderId: data.senderId,
            text: text || "(unable to decrypt)", type: "text", sent: false,
            time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
          }]);
        }
      } catch (err) { console.error("WS parse error", err); }
    };
    ws.onerror  = () => setWsOpen(false);
    ws.onclose  = () => setWsOpen(false);
    return () => { setWsOpen(false); ws.close(); };
  }, [room?.roomHash, roomKey, clientId, downloadAndDecryptFile]);

  /* ── load existing room info + messages ── */
  useEffect(() => {
    if (!room?.roomHash || !roomKey) return;
    (async () => {
      try {
        const info = await getRoomInfo(room.roomHash);
        if (info.success) setRoom(prev => ({ ...prev, creatorId: info.creator_id, expiryTimestamp: info.expiry_timestamp }));
      } catch { /* ignore */ }
    })();
    (async () => {
      try {
        const res = await getRoomMessages(room.roomHash);
        if (!res.success || !Array.isArray(res.messages)) return;
        const loaded = await Promise.all(res.messages.map(async msg => {
          const isFile = msg.type === "file" || msg.type === "image";
          const text   = isFile ? null : await decryptMessage(roomKey, msg.ciphertext||"", msg.iv||"", msg.authTag||"");
          return {
            id: msg.msgId || msg.createdAt || Math.random(),
            type: msg.type || "text",
            text: isFile ? (msg.fileName || "file") : (text || base64ToUtf8(msg.ciphertext || "")),
            fileId: msg.fileId || msg.imageId,
            fileName: msg.fileName,
            sent: msg.senderId === clientId,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
          };
        }));
        setMessages((prev) => (prev.length && loaded.length === 0) ? prev : loaded);
        loaded.forEach(msg => {
          if ((msg.type==="file"||msg.type==="image") && msg.fileId) {
            downloadAndDecryptFile(msg.fileId, msg.fileName)
              .then(url => url && setMessages(prev => prev.map(m => m.fileId===msg.fileId ? {...m,previewUrl:url} : m)))
              .catch(() => {});
          }
        });
      } catch (err) { console.error("Failed to load messages", err); }
    })();
  }, [room?.roomHash, roomKey, clientId, downloadAndDecryptFile, getRoomInfo, setRoom]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = async () => {
    setShowAttachMenu(false);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { showAlert("Not connected", "warning"); return; }
    if (!input.trim()) return;
    if (!roomKey) { showAlert("Room key not available", "error"); return; }
    const now = new Date();
    const { ciphertext, iv, authTag } = await encryptMessage(roomKey, input);
    const hmac = await hmacHex(roomKey, `${ciphertext}${iv}${authTag}`);
    wsRef.current.send(JSON.stringify({ roomHash:room.roomHash, senderId:clientId, ciphertext, iv, authTag, hmac }));
    setMessages(prev => [...prev, {
      id: Date.now(), senderId: clientId, text: input, sent: true, type: "text",
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    }]);
    setInput("");
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      setDownloadingFiles(p => ({ ...p, [fileId]:true }));
      const url = await downloadAndDecryptFile(fileId, fileName);
      if (!url) return;
      setMessages(prev => prev.map(m => m.fileId===fileId ? {...m,previewUrl:url} : m));
      const a = document.createElement("a");
      a.href = url; a.download = fileName || "file.bin";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      showAlert("Download failed: " + (err.message || err), "error");
    } finally {
      setDownloadingFiles(p => ({ ...p, [fileId]:false }));
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* Chat screen sits beside the sidebar on desktop */
        .chat-shell {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          z-index: 2;
        }
        @media (min-width: 768px) {
          .chat-shell {
            left: ${SIDEBAR_WIDTH}px;
          }
        }
        .chat-messages-area {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }
        .chat-input-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .chat-header-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 66px;
          padding: 0 20px;
        }
      `}</style>

      {/* Sidebar (desktop only) — rendered outside the fixed chat shell */}
      {/* NOTE: The sidebar is rendered by a thin companion component below */}

      <div className="chat-shell">

        {showBurnDialog && (
          <BurnDialog
            onConfirm={() => { setShowBurnDialog(false); handleBurnRoom(); }}
            onCancel={() => setShowBurnDialog(false)}
          />
        )}

        {/* ══ HEADER ══ */}
        <div style={{
          background:"rgba(11,11,11,0.97)",
          borderBottom:"1px solid var(--border)",
          backdropFilter:"blur(16px)",
          flexShrink:0, position:"relative",
        }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, var(--yellow), transparent)", opacity:0.5 }} />
          <div className="chat-header-inner">
            {/* Left */}
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button className="back-btn" onClick={() => navigate("home")}>
                <Icon name="arrowLeft" size={18} />
              </button>
              <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:"var(--yellow-dim)", border:"1px solid var(--border-hover)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="lock" size={17} color="var(--yellow)" className="enc-lock" />
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:16, letterSpacing:"-0.2px" }}>
                    Room {room?.code ? `#${room.code}` : "------"}
                  </span>
                  <ConnectionPill open={wsOpen} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <Icon name="shield" size={10} color="var(--green)" />
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--green)", letterSpacing:"0.5px" }}>
                    AES-256-GCM · E2E ENCRYPTED
                  </span>
                </div>
              </div>
            </div>

            {/* Right: timer + burn */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                display:"flex", flexDirection:"column", alignItems:"flex-end",
                background: seconds < 300 ? "rgba(255,59,59,0.08)" : "var(--card2)",
                border:`1px solid ${seconds < 300 ? "rgba(255,59,59,0.25)" : "var(--border)"}`,
                borderRadius:8, padding:"6px 12px", transition:"all 0.4s",
              }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--grey)", letterSpacing:"1px", marginBottom:1 }}>EXPIRES</span>
                <div className={`timer-display ${seconds < 300 ? "urgent" : ""}`} style={{ fontSize:18, letterSpacing:"2px" }}>
                  {fmtCountdown(seconds)}
                </div>
              </div>
              {room?.creatorId === clientId && (
                <button onClick={() => setShowBurnDialog(true)} title="Burn room"
                  style={{ width:42, height:42, borderRadius:10, border:"none", background:"rgba(255,59,59,0.10)", outline:"1px solid rgba(255,59,59,0.28)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(255,59,59,0.22)"; e.currentTarget.style.outline="1px solid rgba(255,59,59,0.55)"; e.currentTarget.style.boxShadow="0 0 14px rgba(255,59,59,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,59,59,0.10)"; e.currentTarget.style.outline="1px solid rgba(255,59,59,0.28)"; e.currentTarget.style.boxShadow="none"; }}>
                  <span style={{ fontSize:20, lineHeight:1 }}>🔥</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══ MESSAGES ══ */}
        <div style={{
          flex:1, overflowY:"auto",
          padding:"20px 20px",
          display:"flex", flexDirection:"column", gap:14,
          maskImage:"linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 24px), transparent 100%)",
          WebkitMaskImage:"linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 24px), transparent 100%)",
        }}>
          <div className="chat-messages-area" style={{ display:"flex", flexDirection:"column", gap:14, flex:1 }}>
            {messages.length === 0 && <EmptyState />}
            {messages.map(m => (
              <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems: m.sent ? "flex-end" : "flex-start" }}>
                {!m.sent && m.senderId && showSenderIds && (
                  <div style={{ marginBottom:4 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey)", letterSpacing:"0.5px" }}>
                      {shortenId(m.senderId)}
                    </span>
                  </div>
                )}
                {m.uploading && (m.type === "file" || m.type === "image")
                  ? <UploadingBubble fileName={m.fileName} progress={uploadProgress} sent={m.sent} />
                  : m.type === "image"
                    ? <ImageBubble msg={m} sent={m.sent} onDownload={handleDownloadFile} downloading={!!downloadingFiles[m.fileId]} />
                    : m.type === "file"
                      ? <FileBubble  msg={m} sent={m.sent} onDownload={handleDownloadFile} downloading={!!downloadingFiles[m.fileId]} />
                      : <div className={`chat-bubble ${m.sent ? "sent" : "received"}`}>{m.text}</div>
                }
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, flexDirection: m.sent ? "row-reverse" : "row" }}>
                  <Icon name="lock" size={9} color="var(--green)" className="enc-lock" />
                  {messageTimestamps && (
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey-dim)" }}>{m.time}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEnd} />
          </div>
        </div>

        {/* ══ INPUT BAR ══ */}
        <div style={{
          background:"rgba(11,11,11,0.97)", borderTop:"1px solid var(--border)",
          padding:"12px 20px", paddingBottom:"calc(12px + env(safe-area-inset-bottom, 0px))",
          backdropFilter:"blur(16px)", flexShrink:0, zIndex:101, position:"relative",
        }}>
          <div className="chat-input-inner">
            {uploadingFile && <UploadBar progress={uploadProgress} />}
            <div style={{ position:"relative" }}>
              {showAttachMenu && (
                <AttachMenu
                  onFile={() => fileInputRef.current?.click()}
                  onImage={() => imageInputRef.current?.click()}
                  onClose={() => setShowAttachMenu(false)}
                />
              )}
              <div style={{
                display:"flex", alignItems:"center", gap:10,
                background:"var(--card)",
                border:`1px solid ${wsOpen ? "var(--border)" : "rgba(255,59,59,0.2)"}`,
                borderRadius:50, padding:"7px",
                transition:"border-color 0.3s",
              }}>
                <button onClick={() => setShowAttachMenu(v => !v)}
                  style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, border:"none", background: showAttachMenu ? "var(--yellow-dim)" : "var(--card2)", outline: showAttachMenu ? "1px solid var(--border-hover)" : "1px solid var(--border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background="var(--yellow-dim)"; e.currentTarget.style.outline="1px solid var(--border-hover)"; }}
                  onMouseLeave={e => { if (!showAttachMenu) { e.currentTarget.style.background="var(--card2)"; e.currentTarget.style.outline="1px solid var(--border)"; } }}>
                  <Icon name="paperclip" size={16} color={showAttachMenu ? "var(--yellow)" : "var(--grey)"} />
                </button>
                <input
                  style={{ flex:1, background:"none", border:"none", outline:"none", color:"var(--white)", fontFamily:"var(--font-body)", fontSize:14, caretColor:"var(--yellow)" }}
                  placeholder={wsOpen ? "Type an encrypted message…" : "Connecting to server…"}
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  disabled={!wsOpen}
                />
                <button onClick={send} disabled={!wsOpen || !input.trim()}
                  style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, border:"none", background: wsOpen && input.trim() ? "var(--yellow)" : "var(--card2)", outline: `1px solid ${wsOpen && input.trim() ? "var(--yellow)" : "var(--border)"}`, cursor: wsOpen && input.trim() ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", boxShadow: wsOpen && input.trim() ? "0 0 14px var(--yellow-glow)" : "none" }}>
                  <Icon name="send" size={15} color={wsOpen && input.trim() ? "#0B0B0B" : "var(--grey-dim)"} />
                </button>
              </div>
              {!wsOpen && (
                <div style={{ marginTop:7, textAlign:"center", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--red)", letterSpacing:"0.5px" }}>
                  ⚠ NOT CONNECTED — messages cannot be sent
                </div>
              )}
            </div>
            <input ref={fileInputRef}   type="file"                            style={{ display:"none" }} onChange={e => handleFileSelected(e, false)} />
            <input ref={imageInputRef}  type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFileSelected(e, true)} />
          </div>
        </div>
      </div>

      {/* ── Sidebar rendered alongside the fixed chat panel (desktop) ── */}
      <ChatSidebar navigate={navigate} currentPage="chat" />
    </>
  );
};

/* ── Thin sidebar that renders only on desktop, behind the fixed chat shell ── */
const ChatSidebar = ({ navigate, currentPage }) => {
  const NAV_ITEMS = [
    { key: "home",     icon: "home",     label: "Home"        },
    { key: "create",   icon: "plus",     label: "Create Room" },
    { key: "join",     icon: "lock",     label: "Join Room"   },
    { key: "filedrop", icon: "upload",   label: "File Drop"   },
    { key: "receive",  icon: "download", label: "Receive"     },
    { key: "settings", icon: "settings", label: "Settings"    },
    { key: "guide",    icon: "book",     label: "User Guide"  },
  ];

  return (
    <>
      <style>{`
        .chat-sidebar-fixed {
          display: none;
        }
        @media (min-width: 768px) {
          .chat-sidebar-fixed {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: ${SIDEBAR_WIDTH}px;
            background: rgba(11,11,11,0.98);
            border-right: 1px solid var(--border);
            padding: 24px 12px;
            z-index: 3;
            overflow-y: auto;
          }
        }
      `}</style>
      <div className="chat-sidebar-fixed">
        {/* Logo */}
        <div style={{ paddingLeft: 6, marginBottom: 28 }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:18, letterSpacing:"-0.5px", color:"var(--white)", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, background:"var(--yellow)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="shield" size={14} color="#0B0B0B" />
            </div>
            SecureCore
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--grey)", letterSpacing:"1.5px", marginTop:4, paddingLeft:36 }}>// PROTOCOL v2.1</div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
          {NAV_ITEMS.map(item => {
            const active = item.key === "chat" || (item.key === "home" && currentPage === "chat");
            const isChatActive = item.key === "home";
            return (
              <button key={item.key} onClick={() => navigate(item.key)}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", background: isChatActive && currentPage==="chat" ? "rgba(245,196,0,0.12)" : "transparent", color: isChatActive && currentPage==="chat" ? "var(--yellow)" : "var(--grey)", fontFamily:"var(--font-mono)", fontSize:12, textAlign:"left", transition:"all 0.18s ease", outline: isChatActive && currentPage==="chat" ? "1px solid rgba(245,196,0,0.2)" : "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="var(--white)"; }}
                onMouseLeave={e => { if (!(isChatActive && currentPage==="chat")) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--grey)"; } }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={item.icon} size={15} color="var(--grey)" />
                </div>
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop:"1px solid var(--border)", paddingTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 6px var(--green)", animation:"pulseDot 1.5s ease-in-out infinite" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--green)", letterSpacing:"0.5px" }}>AES-256 ACTIVE</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatRoomScreen;