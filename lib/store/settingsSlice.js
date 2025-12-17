"use client";

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "bkk_dialer_settings";

export const defaultSettings = {
  // Call Settings
  singleCallMode: true,
  callWaiting: false,
  autoAnswer: "off", // 'off', 'immediate', '3sec', '5sec', '10sec'
  callForwarding: "off", // 'off', 'always', 'busy', 'no-answer'
  callForwardingNumber: "",
  callForwardingDelay: 20,
  denyIncoming: "off", // 'off', 'all', 'anonymous', 'not-in-contacts'
  dtmfMethod: "auto", // 'auto', 'rfc2833', 'info', 'inband'

  // Audio Settings
  ringtone: "/sounds/ringtone.mp3",
  ringtoneVolume: 70,
  speaker: "default",
  microphone: "default",
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,

  // Codec Settings (for reference, WebRTC handles most of this)
  enabledAudioCodecs: ["opus", "g722", "pcmu", "pcma"],

  // Video Settings
  disableVideo: true,
  camera: "default",
  videoBitrate: 256,

  // Network Settings
  stunServer: "stun:stun.l.google.com:19302",
  turnServer: "",
  turnUsername: "",
  turnPassword: "",

  // Recording Settings
  callRecording: false,
  recordingFormat: "webm", // 'webm', 'mp3'

  // UI Settings
  soundEvents: true,
  enableDebugLog: false,
  showNotifications: true,
};

// Available codecs
export const availableCodecs = [
  { id: "opus", name: "Opus 48 kHz" },
  { id: "opus24", name: "Opus 24 kHz" },
  { id: "g722", name: "G.722 16 kHz" },
  { id: "g7221", name: "G.722.1 16 kHz" },
  { id: "g72213", name: "G.722.1 32 kHz" },
  { id: "g7238", name: "G.723 8 kHz" },
  { id: "g729", name: "G.729 8 kHz" },
  { id: "gsm", name: "GSM 8 kHz" },
  { id: "pcmu", name: "G.711 u-law" },
  { id: "pcma", name: "G.711 A-law" },
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
