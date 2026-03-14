const BASE = import.meta.env.VITE_API_BASE_URL || '';

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
export function validateDrop(dropHash) {
  return post('/file-drop/validate', { dropHash });
}
export function downloadFileDrop(fileId, dropHash) {
  const url = `${BASE}/file-drop/${fileId}?dropHash=${encodeURIComponent(dropHash)}`;
  return fetch(url);
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
