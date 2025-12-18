"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "bkk_dialer_call_logs";
const MAX_LOGS = 100;

// Helper to get logs from localStorage
function getStoredLogs() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const logs = JSON.parse(saved);
    // Migrate old logs: ensure all IDs are unique by adding random suffix if needed
    const seenIds = new Set();
    const migratedLogs = logs.map((log) => {
      let id = log.id;
      // If ID doesn't contain '-' (old format) or is duplicate, regenerate it
      if (!id.includes("-") || seenIds.has(id)) {
        id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      seenIds.add(id);
      return { ...log, id };
    });

    // Save migrated logs back
    if (JSON.stringify(logs) !== JSON.stringify(migratedLogs)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedLogs));
    }

    return migratedLogs;
  } catch (e) {
    console.error("Failed to load call logs:", e);
    return [];
  }
}

const initialState = {
  logs: [],
};

const callLogsSlice = createSlice({
  name: "callLogs",
  initialState,
  reducers: {
    initializeLogs: (state) => {
      state.logs = getStoredLogs();
    },
    addLog: (state, action) => {
      const newLog = {
        id: action.payload.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name || "",
        number: action.payload.number || "",
        time: action.payload.time || new Date().toISOString(),
        duration: action.payload.duration || 0,
        direction: action.payload.direction || "outgoing",
        status: action.payload.status || "completed",
        info: action.payload.info || "",
        recordingId: action.payload.recordingId || null,
      };
      state.logs = [newLog, ...state.logs].slice(0, MAX_LOGS);
    },
    updateLog: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.logs.findIndex((log) => log.id === id);
      if (index !== -1) {
        state.logs[index] = { ...state.logs[index], ...updates };
      }
    },
    deleteLog: (state, action) => {
      state.logs = state.logs.filter((log) => log.id !== action.payload);
    },
    clearLogs: (state) => {
      state.logs = [];
    },
  },
});

export const { initializeLogs, addLog, updateLog, deleteLog, clearLogs } =
  callLogsSlice.actions;

// Selectors
export const selectLogs = (state) => state.callLogs.logs;

export default callLogsSlice.reducer;
