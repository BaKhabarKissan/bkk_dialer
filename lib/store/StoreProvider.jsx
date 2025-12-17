"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import {
  initializeAccounts,
} from "./sipConfigSlice";
import { initializeLogs } from "./callLogsSlice";
import { initializeContacts } from "./contactsSlice";
import { initializeSettings } from "./settingsSlice";

export default function StoreProvider({ children }) {
  const storeRef = useRef(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    // Initialize store from localStorage on mount
    if (storeRef.current && typeof window !== "undefined") {
      storeRef.current.dispatch(initializeAccounts());
      storeRef.current.dispatch(initializeLogs());
      storeRef.current.dispatch(initializeContacts());
      storeRef.current.dispatch(initializeSettings());
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
