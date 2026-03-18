// Use a configured backend URL when provided, otherwise fall back to the known production backend.
// In dev mode we keep an empty base so that Vite proxy (configured in vite.config.js) can forward requests.
const DEFAULT_BACKEND = "https://secure-core-backend.onrender.com";
const BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? DEFAULT_BACKEND : "");

async function post(path, body, isForm=false) {
  const opts = { method: 'POST' };
  if (isForm) {
    opts.body = body;
  } else {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  } catch (e) {
    console.error('API post error', path, e);
    throw e;
  }
}

export function createRoom(payload) {
  return post('/room/create', payload);
}
export function joinRoom(code) {
  return post('/room/join', { code });
}
export function getRoomInfo(roomHash) {
  return post('/room/info', { room_hash: roomHash });
}
export function getRoomMessages(roomHash, page=0, limit=50) {
  // Server uses 0-based paging (page 0 = most recent messages)
  return post('/room/messages', { room_hash: roomHash, page, limit });
}
export function burnRoom(roomHash, creatorId) {
  return post('/room/burn', { room_hash: roomHash, creator_id: creatorId });
}
export function createFileDrop(dropHash, duration) {
  return post('/file-drop/create', { dropHash, duration });
}
export function uploadFileDrop(formData) {
  return post('/file-drop/upload', formData, true);
}

export function uploadFileDropWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/file-drop/upload`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.send(formData);
  });
}
export function validateDrop(dropHash) {
  return post('/file-drop/validate', { dropHash });
}
export function downloadFileDrop(fileId, dropHash) {
  const url = `${BASE}/file-drop/${fileId}?dropHash=${encodeURIComponent(dropHash)}`;
  return fetch(url);
}

export function preWarmServer() {
  return fetch(`${BASE}/ping`).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

function parseHeaders(headerString) {
  const headers = {};
  if (!headerString) return headers;
  headerString.split('\r\n').forEach((line) => {
    if (!line) return;
    const parts = line.split(':');
    const key = parts.shift()?.trim();
    const value = parts.join(':').trim();
    if (key) headers[key.toLowerCase()] = value;
  });
  return headers;
}

export function downloadFileDropWithProgress(fileId, dropHash, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${BASE}/file-drop/${fileId}?dropHash=${encodeURIComponent(dropHash)}`;
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          arrayBuffer: xhr.response,
          headers: parseHeaders(xhr.getAllResponseHeaders()),
        });
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    xhr.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.send();
  });
}

// File sharing (chat) endpoints
export function uploadChatFile(formData) {
  return post('/file/upload', formData, true);
}
export function downloadChatFile(fileId, roomHash) {
  const url = `${BASE}/file/${encodeURIComponent(fileId)}?roomHash=${encodeURIComponent(roomHash)}`;
  return fetch(url);
}

// ... add others as needed

export default {
  createRoom,
  joinRoom,
  getRoomInfo,
  getRoomMessages,
  burnRoom,
  createFileDrop,
  uploadFileDrop,
  validateDrop,
  downloadFileDrop,
  uploadChatFile,
  downloadChatFile,
};
