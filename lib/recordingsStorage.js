"use client";

const DB_NAME = "bkk_dialer_recordings";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

let dbInstance = null;

// Open or create the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open recordings database"));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("callLogId", "callLogId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

// Save a recording to IndexedDB
export async function saveRecording(id, blob, callLogId = null) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const recording = {
      id,
      blob,
      callLogId,
      createdAt: new Date().toISOString(),
      size: blob.size,
      type: blob.type,
    };

    const request = store.put(recording);

    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = () => {
      reject(new Error("Failed to save recording"));
    };
  });
}

// Get a recording by ID
export async function getRecording(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get recording"));
    };
  });
}

// Delete a recording by ID
export async function deleteRecording(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(new Error("Failed to delete recording"));
    };
  });
}

// Get all recordings
export async function getAllRecordings() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(new Error("Failed to get recordings"));
    };
  });
}

// Create a blob URL for playback (remember to revoke when done)
export function createPlaybackUrl(blob) {
  return URL.createObjectURL(blob);
}

// Revoke a blob URL
export function revokePlaybackUrl(url) {
  URL.revokeObjectURL(url);
}

// Download a recording
export function downloadRecording(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `recording_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
