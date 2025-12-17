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

  // Audio Settings
  ringtone: "/sounds/ringtone.mp3",
  ringtoneVolume: 70,
  ringDevice: "default",
  speaker: "default",
  microphone: "default",
  microphoneAmplification: false,
  softwareLevelAdjustment: false,

  // Codec Settings
  enabledAudioCodecs: ["opus", "g722", "pcmu", "pcma"],
  vad: false, // Voice Activity Detection
  echoCancellation: true,
  opus2ch: false,
  forceCodecForIncoming: false,

  // Video Settings
  disableVideo: true,
  camera: "default",
  videoCodec: "default",
  enableH264: true,
  enableH263: false,
  enableVP8: true,
  enableVP9: true,
  videoBitrate: 256,

  // Network Settings
  sourcePort: 0,
  rport: true,
  rtpPortMin: 0,
  rtpPortMax: 0,
  nameserver: "",
  dnsSrv: false,
  stunServer: "stun:stun.l.google.com:19302",

  // Recording Settings
  callRecording: false,
  recordingPath: "",
  recordingFormat: "mp3", // 'mp3', 'wav', 'rec'

  // DTMF Settings
  dtmfMethod: "auto", // 'auto', 'rfc2833', 'info', 'inband'

  // UI Settings
  handleMediaButtons: false,
  headsetSupport: false,
  soundEvents: true,
  enableLogFile: false,
  bringToFrontOnIncoming: true,
  enableLocalAccount: false,
  randomPopupPosition: false,
  sendCrashReport: true,
  disableMessaging: false,
  multiMonitorSupport: false,
  handleIpChanges: true,

  // System Settings
  checkForUpdates: "weekly", // 'never', 'daily', 'weekly', 'monthly'
  runAtStartup: false,

  // Directory
  directoryOfUsers: "",
  defaultListAction: "default", // 'default', 'call', 'message'
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
