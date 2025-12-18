"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "bkk_dialer_settings";

export const defaultSettings = {
  // Call Settings
  autoAnswer: "off", // 'off', 'immediate', '3sec', '5sec', '10sec'
  dtmfMethod: "auto", // 'auto', 'rfc2833', 'info'

  // Audio Settings
  ringtone: "/sounds/ringtone.mp3",
  ringtoneVolume: 70,
  speaker: "default",
  microphone: "default",
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  enabledAudioCodecs: ["opus", "g722", "pcmu", "pcma"],

  // Network Settings
  stunServer: "stun:stun.l.google.com:19302",
  turnServer: "",
  turnUsername: "",
  turnPassword: "",

  // Recording Settings
  callRecording: false,

  // UI Settings
  soundEvents: true,
  enableDebugLog: false,
  showNotifications: true,
};

// Available codecs (only browser-supported WebRTC codecs)
export const availableCodecs = [
  { id: "opus", name: "Opus 48 kHz" },
  { id: "g722", name: "G.722 16 kHz" },
  { id: "pcmu", name: "G.711 μ-law (PCMU)" },
  { id: "pcma", name: "G.711 A-law (PCMA)" },
];

function getStoredSettings() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Failed to load settings:", e);
    return null;
  }
}

const initialState = {
  settings: defaultSettings,
  isLoaded: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    initializeSettings: (state) => {
      const stored = getStoredSettings();
      state.settings = stored ? { ...defaultSettings, ...stored } : defaultSettings;
      state.isLoaded = true;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetSettings: (state) => {
      state.settings = defaultSettings;
    },
  },
});

export const { initializeSettings, updateSettings, resetSettings } =
  settingsSlice.actions;

// Selectors
export const selectSettings = (state) => state.settings.settings;
export const selectDefaultSettings = () => defaultSettings;
export const selectIsSettingsLoaded = (state) => state.settings.isLoaded;

export default settingsSlice.reducer;
