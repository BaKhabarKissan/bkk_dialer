"use client";

import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";

// SipConfig imports
import {
  initializeAccounts,
  addAccount as addAccountAction,
  updateAccount as updateAccountAction,
  deleteAccount as deleteAccountAction,
  setActiveAccount as setActiveAccountAction,
  saveConfig as saveConfigAction,
  clearConfig as clearConfigAction,
  selectAccounts,
  selectActiveAccountId,
  selectActiveAccount,
  selectConfig,
  selectIsConfigured,
  selectIsLoaded,
} from "./sipConfigSlice";

// CallLogs imports
import {
  initializeLogs,
  addLog as addLogAction,
  updateLog as updateLogAction,
  deleteLog as deleteLogAction,
  clearLogs as clearLogsAction,
  selectLogs,
} from "./callLogsSlice";

// Contacts imports
import {
  initializeContacts,
  addContact as addContactAction,
  updateContact as updateContactAction,
  deleteContact as deleteContactAction,
  toggleFavorite as toggleFavoriteAction,
  setSearchQuery as setSearchQueryAction,
  selectContacts,
  selectAllContacts,
  selectSearchQuery,
} from "./contactsSlice";

// Settings imports
import {
  initializeSettings,
  updateSettings as updateSettingsAction,
  resetSettings as resetSettingsAction,
  selectSettings,
  selectDefaultSettings,
  selectIsSettingsLoaded,
  defaultSettings,
} from "./settingsSlice";

// Hook to initialize all store data from localStorage
export function useInitializeStore() {
  const dispatch = useDispatch();
  const isLoaded = useSelector(selectIsLoaded);

  useEffect(() => {
    if (!isLoaded && typeof window !== "undefined") {
      dispatch(initializeAccounts());
      dispatch(initializeLogs());
      dispatch(initializeContacts());
      dispatch(initializeSettings());
    }
  }, [dispatch, isLoaded]);

  return isLoaded;
}

// SipConfig hook - matches the original useSipConfig API
export function useSipConfig() {
  const dispatch = useDispatch();

  const accounts = useSelector(selectAccounts);
  const activeAccountId = useSelector(selectActiveAccountId);
  const activeAccount = useSelector(selectActiveAccount);
  const config = useSelector(selectConfig);
  const isConfigured = useSelector(selectIsConfigured);
  const isLoaded = useSelector(selectIsLoaded);

  const addAccount = useCallback(
    (accountData) => {
      // Generate ID first so we can return it and use it in the reducer
      const newId = Date.now().toString();
      const newAccount = { ...accountData, id: newId };
      dispatch(addAccountAction(newAccount));
      return newAccount;
    },
    [dispatch]
  );

  const updateAccount = useCallback(
    (id, updates) => {
      dispatch(updateAccountAction({ id, updates }));
    },
    [dispatch]
  );

  const deleteAccount = useCallback(
    (id) => {
      dispatch(deleteAccountAction(id));
    },
    [dispatch]
  );

  const setActiveAccount = useCallback(
    (id) => {
      dispatch(setActiveAccountAction(id));
    },
    [dispatch]
  );

  const saveConfig = useCallback(
    (newConfig) => {
      dispatch(saveConfigAction(newConfig));
    },
    [dispatch]
  );

  const clearConfig = useCallback(() => {
    dispatch(clearConfigAction());
  }, [dispatch]);

  return {
    // Multi-account API
    accounts,
    activeAccountId,
    activeAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    setActiveAccount,
    // Legacy single-account API
    config,
    saveConfig,
    clearConfig,
    isConfigured,
    isLoaded,
  };
}

// CallLogs hook - matches the original useCallLogs API
export function useCallLogs() {
  const dispatch = useDispatch();
  const logs = useSelector(selectLogs);

  const addLog = useCallback(
    (log) => {
      // Generate ID first so we can return it and use it in the reducer
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newLog = {
        id: newId,
        name: log.name || "",
        number: log.number || "",
        time: log.time || new Date().toISOString(),
        duration: log.duration || 0,
        direction: log.direction || "outgoing",
        status: log.status || "completed",
        info: log.info || "",
      };
      dispatch(addLogAction(newLog));
      return newLog;
    },
    [dispatch]
  );

  const updateLog = useCallback(
    (id, updates) => {
      dispatch(updateLogAction({ id, updates }));
    },
    [dispatch]
  );

  const deleteLog = useCallback(
    (id) => {
      dispatch(deleteLogAction(id));
    },
    [dispatch]
  );

  const clearLogs = useCallback(() => {
    dispatch(clearLogsAction());
  }, [dispatch]);

  return {
    logs,
    addLog,
    updateLog,
    deleteLog,
    clearLogs,
  };
}

// Contacts hook - matches the original useContacts API
export function useContacts() {
  const dispatch = useDispatch();

  const contacts = useSelector(selectContacts);
  const allContacts = useSelector(selectAllContacts);
  const searchQuery = useSelector(selectSearchQuery);

  const addContact = useCallback(
    (contact) => {
      // Generate ID first so we can return it and use it in the reducer
      const newContact = {
        id: Date.now().toString(),
        name: contact.name || "",
        number: contact.number || "",
        email: contact.email || "",
        company: contact.company || "",
        favorite: contact.favorite || false,
        createdAt: new Date().toISOString(),
      };
      dispatch(addContactAction(newContact));
      return newContact;
    },
    [dispatch]
  );

  const updateContact = useCallback(
    (id, updates) => {
      dispatch(updateContactAction({ id, updates }));
    },
    [dispatch]
  );

  const deleteContact = useCallback(
    (id) => {
      dispatch(deleteContactAction(id));
    },
    [dispatch]
  );

  const toggleFavorite = useCallback(
    (id) => {
      dispatch(toggleFavoriteAction(id));
    },
    [dispatch]
  );

  const setSearchQuery = useCallback(
    (query) => {
      dispatch(setSearchQueryAction(query));
    },
    [dispatch]
  );

  return {
    contacts,
    allContacts,
    searchQuery,
    setSearchQuery,
    addContact,
    updateContact,
    deleteContact,
    toggleFavorite,
  };
}

// Settings hook - matches the original useSettings API
export function useSettings() {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const updateSettings = useCallback(
    (updates) => {
      dispatch(updateSettingsAction(updates));
    },
    [dispatch]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetSettingsAction());
  }, [dispatch]);

  return {
    settings,
    updateSettings,
    resetSettings,
    defaultSettings,
  };
}
