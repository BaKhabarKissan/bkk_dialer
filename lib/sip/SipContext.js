"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";

const SipConfigContext = createContext(null);

const STORAGE_KEY = "bkk_dialer_sip_config";

const defaultConfig = {
  server: "",
  domain: "",
  username: "",
  password: "",
  displayName: "",
};

// Helper to get config from localStorage
function getStoredConfig() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Failed to load SIP config:", e);
    return null;
  }
}

// For SSR compatibility
function subscribe(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return getStoredConfig();
}

function getServerSnapshot() {
  return null;
}

export function SipConfigProvider({ children }) {
  // Use useSyncExternalStore to sync with localStorage
  const storedConfig = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [config, setConfig] = useState(() => storedConfig || defaultConfig);
  const [isLoaded, setIsLoaded] = useState(() => typeof window !== "undefined");

  // Save config to localStorage
  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      } catch (e) {
        console.error("Failed to save SIP config:", e);
      }
    }
  };

  // Clear config
  const clearConfig = () => {
    setConfig(defaultConfig);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Check if config is valid
  const isConfigured = Boolean(
    config.server && config.username && config.password
  );

  return (
    <SipConfigContext.Provider
      value={{
        config,
        saveConfig,
        clearConfig,
        isConfigured,
        isLoaded,
      }}
    >
      {children}
    </SipConfigContext.Provider>
  );
}

export function useSipConfig() {
  const context = useContext(SipConfigContext);
  if (!context) {
    throw new Error("useSipConfig must be used within SipConfigProvider");
  }
  return context;
}
