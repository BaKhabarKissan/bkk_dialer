"use client";

import { createContext, useContext, useState, useCallback } from "react";

const SipConfigContext = createContext(null);

const STORAGE_KEY = "bkk_dialer_sip_accounts";
const ACTIVE_ACCOUNT_KEY = "bkk_dialer_active_account";

const defaultAccount = {
  id: "",
  server: "",
  domain: "",
  username: "",
  password: "",
  displayName: "",
  enabled: true,
};

// Helper to get accounts from localStorage
function getStoredAccounts() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load SIP accounts:", e);
    return [];
  }
}

function getStoredActiveAccountId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  } catch (e) {
    return null;
  }
}

function saveAccounts(accounts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save SIP accounts:", e);
  }
}

function saveActiveAccountId(id) {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    }
  } catch (e) {
    console.error("Failed to save active account:", e);
  }
}

export function SipConfigProvider({ children }) {
  const [accounts, setAccounts] = useState(() => getStoredAccounts());
  const [activeAccountId, setActiveAccountId] = useState(() => getStoredActiveAccountId());
  const [isLoaded, setIsLoaded] = useState(() => typeof window !== "undefined");

  // Get active account config
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;

  // For backward compatibility - provide config as the active account
  const config = activeAccount || defaultAccount;

  // Add a new account
  const addAccount = useCallback((accountData) => {
    const newAccount = {
      ...defaultAccount,
      ...accountData,
      id: Date.now().toString(),
    };
    setAccounts((prev) => {
      const updated = [...prev, newAccount];
      saveAccounts(updated);
      return updated;
    });
    // If this is the first account, make it active
    if (accounts.length === 0) {
      setActiveAccountId(newAccount.id);
      saveActiveAccountId(newAccount.id);
    }
    return newAccount;
  }, [accounts.length]);

  // Update an existing account
  const updateAccount = useCallback((id, updates) => {
    setAccounts((prev) => {
      const updated = prev.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      saveAccounts(updated);
      return updated;
    });
  }, []);

  // Delete an account
  const deleteAccount = useCallback((id) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveAccounts(updated);
      // If we deleted the active account, switch to first available
      if (activeAccountId === id) {
        const newActive = updated.length > 0 ? updated[0].id : null;
        setActiveAccountId(newActive);
        saveActiveAccountId(newActive);
      }
      return updated;
    });
  }, [activeAccountId]);

  // Set active account
  const setActiveAccount = useCallback((id) => {
    setActiveAccountId(id);
    saveActiveAccountId(id);
  }, []);

  // Legacy: Save config (updates active account or creates new one)
  const saveConfig = useCallback((newConfig) => {
    if (activeAccountId) {
      updateAccount(activeAccountId, newConfig);
    } else {
      const account = addAccount(newConfig);
      setActiveAccountId(account.id);
      saveActiveAccountId(account.id);
    }
  }, [activeAccountId, updateAccount, addAccount]);

  // Legacy: Clear config
  const clearConfig = useCallback(() => {
    if (activeAccountId) {
      deleteAccount(activeAccountId);
    }
  }, [activeAccountId, deleteAccount]);

  // Check if active account is configured
  const isConfigured = Boolean(
    config.server && config.username && config.password
  );

  return (
    <SipConfigContext.Provider
      value={{
        // Multi-account API
        accounts,
        activeAccountId,
        activeAccount,
        addAccount,
        updateAccount,
        deleteAccount,
        setActiveAccount,
        // Legacy single-account API (for backward compatibility)
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
