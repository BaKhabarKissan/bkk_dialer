"use client";

import { createContext, useContext, useState, useCallback } from "react";

const CallLogsContext = createContext(null);

const STORAGE_KEY = "bkk_dialer_call_logs";
const MAX_LOGS = 100;

// Helper to get logs from localStorage
function getStoredLogs() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load call logs:", e);
    return [];
  }
}

// Helper to save logs to localStorage
function saveLogsToStorage(logs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  } catch (e) {
    console.error("Failed to save call logs:", e);
  }
}

export function CallLogsProvider({ children }) {
  const [logs, setLogs] = useState(() => getStoredLogs());

  // Add a new call log
  const addLog = useCallback((log) => {
    const newLog = {
      id: Date.now().toString(),
      name: log.name || "",
      number: log.number || "",
      time: log.time || new Date().toISOString(),
      duration: log.duration || 0,
      direction: log.direction || "outgoing", // 'incoming' | 'outgoing' | 'missed'
      status: log.status || "completed", // 'completed' | 'missed' | 'rejected' | 'failed'
      info: log.info || "",
    };

    setLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, MAX_LOGS);
      saveLogsToStorage(updated);
      return updated;
    });

    return newLog;
  }, []);

  // Update an existing log (e.g., to add duration when call ends)
  const updateLog = useCallback((id, updates) => {
    setLogs((prev) => {
      const updated = prev.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      );
      saveLogsToStorage(updated);
      return updated;
    });
  }, []);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Delete a specific log
  const deleteLog = useCallback((id) => {
    setLogs((prev) => {
      const updated = prev.filter((log) => log.id !== id);
      saveLogsToStorage(updated);
      return updated;
    });
  }, []);

  return (
    <CallLogsContext.Provider
      value={{
        logs,
        addLog,
        updateLog,
        clearLogs,
        deleteLog,
      }}
    >
      {children}
    </CallLogsContext.Provider>
  );
}

export function useCallLogs() {
  const context = useContext(CallLogsContext);
  if (!context) {
    throw new Error("useCallLogs must be used within CallLogsProvider");
  }
  return context;
}
