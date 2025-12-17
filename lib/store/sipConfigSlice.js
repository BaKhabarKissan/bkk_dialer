"use client";

import { createSlice } from "@reduxjs/toolkit";

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

const initialState = {
  accounts: [],
  activeAccountId: null,
  isLoaded: false,
};

const sipConfigSlice = createSlice({
  name: "sipConfig",
  initialState,
  reducers: {
    initializeAccounts: (state) => {
      state.accounts = getStoredAccounts();
      state.activeAccountId = getStoredActiveAccountId();
      state.isLoaded = true;
    },
    addAccount: (state, action) => {
      const newAccount = {
        ...defaultAccount,
        ...action.payload,
        id: Date.now().toString(),
      };
      state.accounts.push(newAccount);
      // If this is the first account, make it active
      if (state.accounts.length === 1) {
        state.activeAccountId = newAccount.id;
      }
    },
    updateAccount: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.accounts.findIndex((a) => a.id === id);
      if (index !== -1) {
        state.accounts[index] = { ...state.accounts[index], ...updates };
      }
    },
    deleteAccount: (state, action) => {
      const id = action.payload;
      state.accounts = state.accounts.filter((a) => a.id !== id);
      // If we deleted the active account, switch to first available
      if (state.activeAccountId === id) {
        state.activeAccountId = state.accounts.length > 0 ? state.accounts[0].id : null;
      }
    },
    setActiveAccount: (state, action) => {
      state.activeAccountId = action.payload;
    },
    // Legacy: Save config (updates active account or creates new one)
    saveConfig: (state, action) => {
      if (state.activeAccountId) {
        const index = state.accounts.findIndex((a) => a.id === state.activeAccountId);
        if (index !== -1) {
          state.accounts[index] = { ...state.accounts[index], ...action.payload };
        }
      } else {
        const newAccount = {
          ...defaultAccount,
          ...action.payload,
          id: Date.now().toString(),
        };
        state.accounts.push(newAccount);
        state.activeAccountId = newAccount.id;
      }
    },
    // Legacy: Clear config
    clearConfig: (state) => {
      if (state.activeAccountId) {
        state.accounts = state.accounts.filter((a) => a.id !== state.activeAccountId);
        state.activeAccountId = state.accounts.length > 0 ? state.accounts[0].id : null;
      }
    },
  },
});

export const {
  initializeAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  setActiveAccount,
  saveConfig,
  clearConfig,
} = sipConfigSlice.actions;

// Selectors
export const selectAccounts = (state) => state.sipConfig.accounts;
export const selectActiveAccountId = (state) => state.sipConfig.activeAccountId;
export const selectActiveAccount = (state) => {
  const { accounts, activeAccountId } = state.sipConfig;
  return accounts.find((a) => a.id === activeAccountId) || null;
};
export const selectConfig = (state) => {
  const activeAccount = selectActiveAccount(state);
  return activeAccount || defaultAccount;
};
export const selectIsConfigured = (state) => {
  const config = selectConfig(state);
  return Boolean(config.server && config.username && config.password);
};
export const selectIsLoaded = (state) => state.sipConfig.isLoaded;

export default sipConfigSlice.reducer;
