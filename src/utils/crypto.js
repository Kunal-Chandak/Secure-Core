// simple crypto helpers using Web Crypto API

// convert array buffer to hex string
function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function concatBuffers(...buffers) {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  buffers.forEach((buf) => {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  });
  return result;
}

export async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return buf2hex(hash);
}

export function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return buf2hex(arr.buffer);
}

export function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function bytesToBase64(bytes) {
  // Avoid stack overflow for large arrays by chunking
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function randomBase64(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bytesToBase64(arr);
}

export function utf8ToBase64(value) {

  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str);
}

export function base64ToUtf8(b64) {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Derive an AES-GCM key from the room code + salt.
 * Uses PBKDF2(SHA-256) with 100k iterations to match backend trust.
 */
export function base64ToBytes(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export async function deriveRoomKey(code, saltBase64) {
  const encoder = new TextEncoder();
  const salt = base64ToBytes(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(code),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  // Make the derived key extractable so we can use it for HMAC (to match mobile behavior).
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a plaintext string using AES-GCM and return base64 parts.
 */
export async function encryptMessage(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const authTag = encryptedBytes.slice(encryptedBytes.length - 16);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag),
  };
}

export async function encryptBuffer(key, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer,
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const authTag = encryptedBytes.slice(encryptedBytes.length - 16);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag),
  };
}

export async function decryptBuffer(key, ciphertextB64, ivB64, authTagB64) {
  const ciphertext = base64ToBytes(ciphertextB64);
  const iv = base64ToBytes(ivB64);
  const authTag = base64ToBytes(authTagB64);
  const combined = concatBuffers(ciphertext.buffer, authTag.buffer);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined,
  );
  return new Uint8Array(decrypted);
}

export async function decryptBufferRaw(key, ciphertextBytes, ivB64, authTagB64) {
  const iv = base64ToBytes(ivB64);
  const authTag = base64ToBytes(authTagB64);
  const combined = concatBuffers(ciphertextBytes.buffer, authTag.buffer);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined,
  );
  return new Uint8Array(decrypted);
}

/**
 * Decrypt a message from base64 parts (ciphertext + iv + authTag).
 */
export async function decryptMessage(key, ciphertextB64, ivB64, authTagB64) {
  try {
    const decode = (b64) => {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    };

    const ciphertext = decode(ciphertextB64);
    const iv = decode(ivB64);
    const authTag = decode(authTagB64);

    const combined = concatBuffers(ciphertext.buffer, authTag.buffer);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    return "";
  }
}

export async function hmacHex(key, message) {
  // WebCrypto does not allow using the AES key directly for HMAC,
  // so we export the raw bytes and import an HMAC key from them.
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(message));

  return buf2hex(signature);
}

// generate the basic payload fields for creating a room
// NOTE: backend join endpoint computes hash as sha256(code) so we must
// use the same value when creating a room. The salt is kept for client
// crypto but isn't part of the lookup key.
export async function generateRoomFields({ code, isGroup, expirySeconds, creatorId }) {
  // Use base64 salt to match the mobile implementation (Dart uses base64Encode).
  const salt = randomBase64(16);
  const room_hash = await sha256(code); // match joinRoom logic
  return {
    room_hash,
    room_code: code,
    room_salt: salt,
    expiry: expirySeconds,
    is_group: !!isGroup,
    creator_id: creatorId || '',
  };
}
