import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { useAppContext } from "../context/AppContext";
import { connectWS } from "../utils/ws";
import { getRoomMessages, uploadChatFile, downloadChatFile } from "../api";
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

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/** Live / offline pill shown in header */
const ConnectionPill = ({ open }) => (
  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
    <div style={{
      width:6, height:6, borderRadius:"50%",
      background: open ? "var(--green)" : "var(--red)",
      boxShadow: `0 0 6px ${open ? "var(--green)" : "var(--red)"}`,
      animation: open ? "pulseDot 1.5s ease-in-out infinite" : "none",
    }} />
    <span style={{
      fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.5px",
      color: open ? "var(--green)" : "var(--red)",
    }}>
      {open ? "LIVE" : "OFFLINE"}
    </span>
  </div>
);

/** Uploading placeholder bubble */
const UploadingBubble = ({ fileName, progress, sent }) => {
  const bg    = sent ? "rgba(0,0,0,0.15)" : "var(--yellow-dim)";
  const acct  = sent ? "#0B0B0B"          : "var(--yellow)";
  const muted = sent ? "rgba(0,0,0,0.4)"  : "var(--grey)";
  const bar   = sent ? "rgba(0,0,0,0.4)"  : "linear-gradient(90deg,var(--yellow),#FFE066)";
  const track = sent ? "rgba(0,0,0,0.12)" : "var(--card2)";

  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`}
      style={{ minWidth:220, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{
          width:36, height:36, borderRadius:8, flexShrink:0,
          background:bg, border:`1px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border-hover)"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon name="upload" size={16} color={acct} />
        </div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:13,
            color: sent ? "#0B0B0B" : "var(--white)",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{fileName}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:muted, marginTop:2 }}>
            ENCRYPTING & UPLOADING…
          </div>
        </div>
      </div>
      <div style={{ height:3, borderRadius:2, background:track, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:2,
          width:`${progress ?? 40}%`,
          background:bar,
          transition:"width 0.3s ease",
          boxShadow: sent ? "none" : "0 0 6px var(--yellow-glow)",
        }} />
      </div>
    </div>
  );
};

/** File attachment bubble */
const FileBubble = ({ msg, sent, onDownload, downloading }) => {
  const bg    = sent ? "rgba(0,0,0,0.15)" : "var(--yellow-dim)";
  const acct  = sent ? "#0B0B0B"          : "var(--yellow)";
  const muted = sent ? "rgba(0,0,0,0.5)"  : "var(--grey)";
  const dlBg  = sent ? "rgba(0,0,0,0.2)"  : "var(--card)";
  const dlHov = sent ? "rgba(0,0,0,0.35)" : "var(--yellow-dim)";

  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`}
      style={{ minWidth:220, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Icon */}
        <div style={{
          width:40, height:40, borderRadius:8, flexShrink:0,
          background:bg, border:`1px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border-hover)"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon name="file" size={18} color={acct} />
        </div>

        {/* Name + label */}
        <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
          <div style={{
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:13,
            color: sent ? "#0B0B0B" : "var(--white)",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            marginBottom:2,
          }}>
            {msg.fileName || "Attachment"}
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:muted }}>
            ENCRYPTED FILE
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={() => onDownload(msg.fileId, msg.fileName)}
          disabled={downloading}
          style={{
            width:34, height:34, borderRadius:8, border:"none",
            background:dlBg, cursor: downloading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0, transition:"all 0.2s",
            opacity: downloading ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = dlHov; }}
          onMouseLeave={e => { e.currentTarget.style.background = dlBg; }}
        >
          {downloading
            ? <div style={{ width:14, height:14, border:`2px solid ${sent ? "rgba(0,0,0,0.2)" : "var(--border)"}`, borderTopColor:acct, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            : <Icon name="download" size={15} color={acct} />
          }
        </button>
      </div>
    </div>
  );
};

/** Image bubble */
const ImageBubble = ({ msg, sent, onDownload, downloading }) => {
  const acct   = sent ? "#0B0B0B" : "var(--yellow)";
  const btnBg  = sent ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.05)";
  const skBg   = sent ? "rgba(0,0,0,0.15)" : "var(--card2)";
  const skText = sent ? "rgba(0,0,0,0.4)"  : "var(--grey-dim)";

  return (
    <div className={`chat-bubble ${sent ? "sent" : "received"}`}
      style={{ padding:8, minWidth:200 }}>

      {msg.previewUrl ? (
        <img
          src={msg.previewUrl}
          alt={msg.fileName || "image"}
          style={{ display:"block", maxWidth:240, width:"100%", borderRadius:10, marginBottom:6 }}
        />
      ) : (
        <div style={{
          width:240, height:150, borderRadius:10, marginBottom:6,
          background:skBg, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:8,
          border:`1px solid ${sent ? "rgba(0,0,0,0.1)" : "var(--border)"}`,
        }}>
          <Icon name="camera" size={28} color={skText} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:skText }}>
            {msg.uploading ? "UPLOADING…" : "LOADING…"}
          </span>
        </div>
      )}

      {/* View / Save row */}
      <button
        onClick={() => onDownload(msg.fileId, msg.fileName)}
        disabled={downloading}
        style={{
          width:"100%", border:"none",
          background:btnBg, color:acct,
          borderRadius:6, padding:"7px 10px",
          fontFamily:"var(--font-mono)", fontSize:11,
          cursor: downloading ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          transition:"all 0.2s", opacity: downloading ? 0.6 : 1,
        }}
      >
        {downloading
          ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:"currentColor", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> DOWNLOADING…</>
          : <><Icon name="download" size={12} color="currentColor" /> VIEW / SAVE</>
        }
      </button>
    </div>
  );
};

/** Attach popover menu */
const AttachMenu = ({ onFile, onImage, onClose }) => (
  <>
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9 }} />
    <div style={{
      position:"absolute", bottom:"calc(100% + 10px)", left:0,
      background:"rgba(13,13,13,0.98)",
      border:"1px solid var(--border-hover)",
      borderRadius:12, padding:8, zIndex:10, width:210,
      boxShadow:"0 0 24px rgba(245,196,0,0.15), 0 12px 40px rgba(0,0,0,0.7)",
      animation:"fadeSlideIn 0.18s ease forwards",
    }}>
      <div style={{
        fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey-dim)",
        letterSpacing:"1.5px", padding:"4px 10px 8px",
      }}>
        // ATTACH
      </div>

      {[
        { icon:"camera", label:"Photo / Camera", action:onImage },
        { icon:"file",   label:"Choose File",    action:onFile  },
      ].map(item => (
        <button
          key={item.label}
          onClick={item.action}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:10,
            padding:"10px 10px", borderRadius:8, border:"none",
            background:"transparent", color:"var(--white)",
            fontFamily:"var(--font-body)", fontSize:14,
            cursor:"pointer", transition:"all 0.15s", textAlign:"left",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--yellow-dim)";
            e.currentTarget.style.color      = "var(--yellow)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color      = "var(--white)";
          }}
        >
          <div style={{
            width:30, height:30, borderRadius:6,
            background:"var(--card2)", border:"1px solid var(--border)",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Icon name={item.icon} size={14} color="var(--yellow)" />
          </div>
          {item.label}
        </button>
      ))}
    </div>
  </>
);

/** Slim upload progress strip above the input */
const UploadBar = ({ progress }) => (
  <div style={{ marginBottom:8 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{
          width:6, height:6, borderRadius:"50%",
          background:"var(--yellow)", animation:"pulseDot 1s infinite",
          boxShadow:"0 0 6px var(--yellow-glow)",
        }} />
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--yellow)", letterSpacing:"0.5px" }}>
          ENCRYPTING & UPLOADING
        </span>
      </div>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey)" }}>
        {Math.round(progress)}%
      </span>
    </div>
    <div className="progress-bar" style={{ height:3 }}>
      <div className="progress-fill" style={{ width:`${progress}%` }} />
    </div>
  </div>
);

/** Empty state shown when there are no messages yet */
const EmptyState = () => (
  <div style={{
    flex:1, display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    gap:14, opacity:0.45, paddingTop:60,
  }}>
    <div style={{
      width:60, height:60, borderRadius:16,
      background:"var(--yellow-dim)", border:"1px solid var(--border-hover)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <Icon name="lock" size={28} color="var(--yellow)" className="enc-lock" />
    </div>
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--grey)", letterSpacing:"0.5px", marginBottom:4 }}>
        SECURE CHANNEL READY
      </div>
      <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--grey-dim)" }}>
        Messages appear here once sent
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ChatRoomScreen = ({ navigate }) => {
  const { clientId, room } = useAppContext();

  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [seconds,         setSeconds]         = useState(0);
  const [wsOpen,          setWsOpen]          = useState(false);
  const [uploadingFile,   setUploadingFile]   = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [downloadingFiles,setDownloadingFiles]= useState({});
  const [showAttachMenu,  setShowAttachMenu]  = useState(false);
  const [roomKey,         setRoomKey]         = useState(null);

  const shortenId = (id) => {
    if (!id) return "";
    if (id.length < 8) return id;
    return `${id.slice(0, 3)}-${id.slice(id.length - 6, id.length - 4)}-${id.slice(id.length - 2)}`;
  };

  const wsRef         = useRef(null);
  const fileInputRef  = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEnd   = useRef(null);
  const fileDownloadPromisesRef = useRef(new Map());
  const fileUrlCacheRef         = useRef(new Map());

  const getCachedMessages = (roomHash) => {
    try {
      const raw = localStorage.getItem(`securecore:messages:${roomHash}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistMessages = (roomHash, msgs) => {
    try {
      const toStore = msgs.map((m) => ({
        id: m.id,
        type: m.type,
        text: m.text,
        fileId: m.fileId,
        fileName: m.fileName,
        sent: m.sent,
        senderId: m.senderId,
        time: m.time,
      }));
      localStorage.setItem(`securecore:messages:${roomHash}`, JSON.stringify(toStore));
    } catch {
      // ignore
    }
  };

  /* cleanup blob URLs */
  useEffect(() => {
    const cache = fileUrlCacheRef.current;
    return () => { cache.forEach(URL.revokeObjectURL); cache.clear(); };
  }, []);

  /* derive room key */
  useEffect(() => {
    let cancelled = false;
    if (!room?.code || !room?.roomSalt) return setRoomKey(null);
    deriveRoomKey(room.code, room.roomSalt)
      .then(k => { if (!cancelled) setRoomKey(k); })
      .catch(e => console.error("room key derivation failed", e));
    return () => { cancelled = true; };
  }, [room?.code, room?.roomSalt]);

  /* countdown */
  useEffect(() => {
    if (!room?.roomHash) { navigate("home"); return; }
    const expiry = () => {
      const ts = room.expiryTimestamp;
      return typeof ts === "number" ? ts : (Date.parse(ts) || Date.now());
    };
    const tick = () => setSeconds(Math.max(0, Math.floor((expiry() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [room, navigate]);

  /* load cached messages quickly (optimistic UI) */
  useEffect(() => {
    if (!room?.roomHash) return;
    const cached = getCachedMessages(room.roomHash);
    if (cached.length) {
      setMessages(cached);
    }
  }, [room?.roomHash]);

  /* persist messages so re-entering room restores them instantly */
  useEffect(() => {
    if (!room?.roomHash) return;
    persistMessages(room.roomHash, messages);
  }, [room?.roomHash, messages]);

  /* decrypt + cache a file */
  const downloadAndDecryptFile = useCallback(async (fileId, fileName) => {
    if (!roomKey) throw new Error("Room key not available");
    if (fileUrlCacheRef.current.has(fileId)) return fileUrlCacheRef.current.get(fileId);
    if (fileDownloadPromisesRef.current.has(fileId)) return fileDownloadPromisesRef.current.get(fileId);

    const p = (async () => {
      const res = await downloadChatFile(fileId, room?.roomHash);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const iv      = res.headers.get("x-file-iv")      || "";
      const authTag = res.headers.get("x-file-authtag") || "";
      const ab      = await res.arrayBuffer();
      const plain   = await decryptBufferRaw(roomKey, new Uint8Array(ab), iv, authTag);
      const url     = URL.createObjectURL(new Blob([plain], { type: guessMimeType(fileName) }));
      fileUrlCacheRef.current.set(fileId, url);
      return url;
    })();

    fileDownloadPromisesRef.current.set(fileId, p);
    try { return await p; } finally { fileDownloadPromisesRef.current.delete(fileId); }
  }, [room?.roomHash, roomKey]);

  /* websocket */
  useEffect(() => {
    if (!room?.roomHash || !roomKey) return;
    const ws = connectWS();
    wsRef.current = ws;

    ws.onopen = () => {
      setWsOpen(true);
      ws.send(JSON.stringify({ type:"join_room", roomHash:room.roomHash, senderId:clientId }));
    };

    ws.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);

        if ((data.type === "image" || data.type === "file") && data.senderId) {
          const fileId = data.fileId || data.imageId;
          const newMsg = {
            id: data.msgId || fileId || Date.now(),
            type: data.type,
            fileId,
            fileName: data.fileName,
            senderId: data.senderId,
            sent: data.senderId === clientId,
            time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
            uploading: false,
          };
          setMessages(prev => {
            const idx = prev.findIndex(m => m.fileId && m.fileId === fileId);
            if (idx >= 0) { const n=[...prev]; n[idx]={...n[idx],...newMsg}; return n; }
            return [...prev, newMsg];
          });
          downloadAndDecryptFile(fileId, data.fileName)
            .then(url => url && setMessages(prev =>
              prev.map(m => m.fileId === fileId ? { ...m, previewUrl:url } : m)))
            .catch(() => {});
          return;
        }

        if (data.ciphertext && data.senderId) {
          if (data.senderId === clientId) return;
          const text = await decryptMessage(roomKey, data.ciphertext, data.iv, data.authTag);
          setMessages(prev => [...prev, {
            id: data.msgId || Date.now(),
            senderId: data.senderId,
            text: text || "(unable to decrypt)",
            type: "text",
            sent: false,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }]);
        }
      } catch (err) { console.error("WS parse error", err); }
    };

    ws.onerror  = () => setWsOpen(false);
    ws.onclose  = () => setWsOpen(false);
    return () => { setWsOpen(false); ws.close(); };
  }, [room?.roomHash, roomKey, clientId, downloadAndDecryptFile]);

  /* load history */
  useEffect(() => {
    if (!room?.roomHash || !roomKey) return;
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
        const reversed = loaded.reverse();
        setMessages((prev) => {
          // Preserve cached messages if the server returns nothing.
          if (prev.length && reversed.length === 0) return prev;
          return reversed;
        });

        reversed.forEach(msg => {
          if ((msg.type==="file"||msg.type==="image") && msg.fileId) {
            downloadAndDecryptFile(msg.fileId, msg.fileName)
              .then(url => url && setMessages(prev =>
                prev.map(m => m.fileId===msg.fileId ? {...m,previewUrl:url} : m)))
              .catch(() => {});
          }
        });
      } catch (err) { console.error("Failed to load messages", err); }
    })();
  }, [room?.roomHash, roomKey, clientId, downloadAndDecryptFile]);

  /* auto-scroll */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  /* send text */
  const send = async () => {
    setShowAttachMenu(false);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { alert("Not connected"); return; }
    if (!input.trim()) return;
    if (!roomKey) { alert("Room key not available"); return; }
    const now = new Date();
    const { ciphertext, iv, authTag } = await encryptMessage(roomKey, input);
    const hmac = await hmacHex(roomKey, `${ciphertext}${iv}${authTag}`);
    wsRef.current.send(JSON.stringify({ roomHash:room.roomHash, senderId:clientId, ciphertext, iv, authTag, hmac }));
    setMessages(prev => [...prev, {
      id: Date.now(),
      senderId: clientId,
      text: input,
      sent: true,
      type: "text",
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    }]);
    setInput("");
  };

  /* send file */
  const handleFileSelected = async (e, isImage) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    e.target.value = null;
    setShowAttachMenu(false);
    if (!roomKey) { alert("Room key not available"); return; }

    setUploadingFile(true);
    setUploadProgress(0);
    const timer = setInterval(() =>
      setUploadProgress(p => Math.min(95, p + Math.random() * 12)), 120);

    try {
      const buffer = await file.arrayBuffer();
      const { ciphertext, iv, authTag } = await encryptBuffer(roomKey, buffer);
      const hmac = await hmacHex(roomKey, `${ciphertext}${iv}${authTag}`);
      const form = new FormData();
      form.append("roomHash",  room.roomHash);
      form.append("file",      new Blob([base64ToBytes(ciphertext)]), file.name);
      form.append("fileName",  file.name);
      form.append("fileSize",  String(file.size));
      form.append("iv",        iv);
      form.append("authTag",   authTag);
      form.append("hmac",      hmac);

      const res = await uploadChatFile(form);
      if (!res.success || !res.fileId) throw new Error(res.error || "Upload failed");

      const now = new Date();
      const fileId = res.fileId;
      setMessages(prev => [...prev, {
        id:fileId,
        senderId: clientId,
        type: isImage ? "image" : "file",
        fileId,
        fileName:file.name,
        sent:true,
        uploading:true,
        time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`,
      }]);
      wsRef.current.send(JSON.stringify({
        type: isImage ? "image" : "file",
        roomHash:room.roomHash, senderId:clientId, fileId, fileName:file.name,
      }));
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      clearInterval(timer);
      setUploadProgress(0);
      setUploadingFile(false);
    }
  };

  /* download file */
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
      console.error("Download failed", err);
      alert("Download failed: " + (err.message || err));
    } finally {
      setDownloadingFiles(p => ({ ...p, [fileId]:false }));
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div style={{
      position:"fixed", inset:0,
      display:"flex", flexDirection:"column",
      zIndex:2,
    }}>

      {/* ══ HEADER ══ */}
      <div style={{
        background:"rgba(11,11,11,0.97)",
        borderBottom:"1px solid var(--border)",
        padding:"0 20px",
        backdropFilter:"blur(16px)",
        flexShrink:0,
        position:"relative",
      }}>
        {/* yellow top accent */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:2,
          background:"linear-gradient(90deg, transparent, var(--yellow), transparent)",
          opacity:0.5,
        }} />

        <div style={{
          maxWidth:480, margin:"0 auto",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          height:66,
        }}>
          {/* Left */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="back-btn" onClick={() => navigate("home")}>
              <Icon name="arrowLeft" size={18} />
            </button>

            {/* Room avatar */}
            <div style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:"var(--yellow-dim)",
              border:"1px solid var(--border-hover)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Icon name="lock" size={17} color="var(--yellow)" className="enc-lock" />
            </div>

            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                <span style={{
                  fontFamily:"var(--font-display)", fontWeight:700, fontSize:16, letterSpacing:"-0.2px",
                }}>
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

          {/* Right: timer */}
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"flex-end",
            background: seconds < 300 ? "rgba(255,59,59,0.08)" : "var(--card2)",
            border:`1px solid ${seconds < 300 ? "rgba(255,59,59,0.25)" : "var(--border)"}`,
            borderRadius:8, padding:"6px 12px",
            transition:"all 0.4s",
          }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--grey)", letterSpacing:"1px", marginBottom:1 }}>
              EXPIRES
            </span>
            <div
              className={`timer-display ${seconds < 300 ? "urgent" : ""}`}
              style={{ fontSize:18, letterSpacing:"2px" }}
            >
              {fmtCountdown(seconds)}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MESSAGES ══ */}
      <div style={{
        flex:1, overflowY:"auto",
        padding:"20px 16px",
        maxWidth:480, width:"100%", margin:"0 auto",
        display:"flex", flexDirection:"column", gap:14,
        maskImage:"linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 24px), transparent 100%)",
        WebkitMaskImage:"linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 24px), transparent 100%)",
      }}>
        {messages.length === 0 && <EmptyState />}

        {messages.map(m => (
          <div
            key={m.id}
            style={{
              display:"flex", flexDirection:"column",
              alignItems: m.sent ? "flex-end" : "flex-start",
            }}
          >
            {/* sender id for others */}
            {!m.sent && m.senderId && (
              <div style={{ marginBottom: 4 }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--grey)",
                  letterSpacing: "0.5px",
                }}>
                  {shortenId(m.senderId)}
                </span>
              </div>
            )}

            {/* bubble switcher */}
            {m.uploading && (m.type === "file" || m.type === "image")
              ? <UploadingBubble fileName={m.fileName} progress={uploadProgress} sent={m.sent} />
              : m.type === "image"
                ? <ImageBubble msg={m} sent={m.sent} onDownload={handleDownloadFile} downloading={!!downloadingFiles[m.fileId]} />
                : m.type === "file"
                  ? <FileBubble  msg={m} sent={m.sent} onDownload={handleDownloadFile} downloading={!!downloadingFiles[m.fileId]} />
                  : <div className={`chat-bubble ${m.sent ? "sent" : "received"}`}>{m.text}</div>
            }

            {/* timestamp row */}
            <div style={{
              display:"flex", alignItems:"center", gap:5, marginTop:5,
              flexDirection: m.sent ? "row-reverse" : "row",
            }}>
              <Icon name="lock" size={9} color="var(--green)" className="enc-lock" />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--grey-dim)" }}>
                {m.time}
              </span>
            </div>
          </div>
        ))}

        <div ref={messagesEnd} />
      </div>

      {/* ══ INPUT BAR ══ */}
      <div style={{
        background:"rgba(11,11,11,0.97)",
        borderTop:"1px solid var(--border)",
        padding:"12px 16px",
        paddingBottom:"calc(12px + env(safe-area-inset-bottom, 0px))",
        backdropFilter:"blur(16px)",
        flexShrink:0,
        zIndex:101,
        position:"relative",
      }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>

          {/* upload progress strip */}
          {uploadingFile && <UploadBar progress={uploadProgress} />}

          {/* input row */}
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
              borderRadius:50, padding:"7px 7px 7px 7px",
              transition:"border-color 0.3s",
            }}>
              {/* Attach */}
              <button
                onClick={() => setShowAttachMenu(v => !v)}
                style={{
                  width:38, height:38, borderRadius:"50%", flexShrink:0, border:"none",
                  background: showAttachMenu ? "var(--yellow-dim)" : "var(--card2)",
                  outline: showAttachMenu ? "1px solid var(--border-hover)" : "1px solid var(--border)",
                  cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="var(--yellow-dim)"; e.currentTarget.style.outline="1px solid var(--border-hover)"; }}
                onMouseLeave={e => { if (!showAttachMenu) { e.currentTarget.style.background="var(--card2)"; e.currentTarget.style.outline="1px solid var(--border)"; } }}
              >
                <Icon name="paperclip" size={16} color={showAttachMenu ? "var(--yellow)" : "var(--grey)"} />
              </button>

              {/* Text */}
              <input
                style={{
                  flex:1, background:"none", border:"none", outline:"none",
                  color:"var(--white)", fontFamily:"var(--font-body)", fontSize:14,
                  caretColor:"var(--yellow)",
                }}
                placeholder={wsOpen ? "Type an encrypted message…" : "Connecting to server…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                disabled={!wsOpen}
              />

              {/* Send */}
              <button
                onClick={send}
                disabled={!wsOpen || !input.trim()}
                style={{
                  width:38, height:38, borderRadius:"50%", flexShrink:0, border:"none",
                  background: wsOpen && input.trim() ? "var(--yellow)" : "var(--card2)",
                  outline: `1px solid ${wsOpen && input.trim() ? "var(--yellow)" : "var(--border)"}`,
                  cursor: wsOpen && input.trim() ? "pointer" : "not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.2s",
                  boxShadow: wsOpen && input.trim() ? "0 0 14px var(--yellow-glow)" : "none",
                }}
              >
                <Icon name="send" size={15} color={wsOpen && input.trim() ? "#0B0B0B" : "var(--grey-dim)"} />
              </button>
            </div>

            {/* offline warning */}
            {!wsOpen && (
              <div style={{
                marginTop:7, textAlign:"center",
                fontFamily:"var(--font-mono)", fontSize:10,
                color:"var(--red)", letterSpacing:"0.5px",
              }}>
                ⚠ NOT CONNECTED — messages cannot be sent
              </div>
            )}
          </div>

          {/* hidden inputs */}
          <input ref={fileInputRef}  type="file"                           style={{ display:"none" }} onChange={e => handleFileSelected(e, false)} />
          <input ref={imageInputRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFileSelected(e, true)} />
        </div>
      </div>
    </div>
  );
};

export default ChatRoomScreen;
