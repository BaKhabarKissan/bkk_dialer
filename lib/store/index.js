"use client";

import { configureStore } from "@reduxjs/toolkit";
import sipConfigReducer from "./sipConfigSlice";
import callLogsReducer from "./callLogsSlice";
import contactsReducer from "./contactsSlice";
import settingsReducer from "./settingsSlice";

// Storage keys
const STORAGE_KEYS = {
  sipAccounts: "bkk_dialer_sip_accounts",
  activeAccount: "bkk_dialer_active_account",
  callLogs: "bkk_dialer_call_logs",
  contacts: "bkk_dialer_contacts",
  settings: "bkk_dialer_settings",
};

// LocalStorage persistence middleware
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (typeof window === "undefined") return result;

  const state = store.getState();

  try {
    // Persist SIP accounts
    if (action.type.startsWith("sipConfig/")) {
      localStorage.setItem(
        STORAGE_KEYS.sipAccounts,
        JSON.stringify(state.sipConfig.accounts)
      );
      if (state.sipConfig.activeAccountId) {
        localStorage.setItem(
          STORAGE_KEYS.activeAccount,
          state.sipConfig.activeAccountId
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.activeAccount);
      }
    }

    // Persist call logs
    if (action.type.startsWith("callLogs/")) {
      localStorage.setItem(
        STORAGE_KEYS.callLogs,
        JSON.stringify(state.callLogs.logs.slice(0, 100))
      );
    }

    // Persist contacts
    if (action.type.startsWith("contacts/") && action.type !== "contacts/setSearchQuery") {
      localStorage.setItem(
        STORAGE_KEYS.contacts,
        JSON.stringify(state.contacts.contacts)
      );
    }

    // Persist settings
    if (action.type.startsWith("settings/") && action.type !== "settings/initializeSettings") {
      if (action.type === "settings/resetSettings") {
        localStorage.removeItem(STORAGE_KEYS.settings);
      } else {
        localStorage.setItem(
          STORAGE_KEYS.settings,
          JSON.stringify(state.settings.settings)
        );
      }
    }
  } catch (e) {
    console.error("Failed to persist state to localStorage:", e);
  }

  return result;
};

export const makeStore = () => {
  return configureStore({
    reducer: {
      sipConfig: sipConfigReducer,
      callLogs: callLogsReducer,
      contacts: contactsReducer,
      settings: settingsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(localStorageMiddleware),
  });
};

// Export types for TypeScript (even in JS for better IDE support)
export const store = makeStore();
