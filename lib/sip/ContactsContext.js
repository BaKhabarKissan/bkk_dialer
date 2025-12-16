"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ContactsContext = createContext(null);

const STORAGE_KEY = "bkk_dialer_contacts";

function getStoredContacts() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load contacts:", e);
    return [];
  }
}

function saveContacts(contacts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error("Failed to save contacts:", e);
  }
}

export function ContactsProvider({ children }) {
  const [contacts, setContacts] = useState(() => getStoredContacts());
  const [searchQuery, setSearchQuery] = useState("");

  const addContact = useCallback((contact) => {
    const newContact = {
      id: Date.now().toString(),
      name: contact.name || "",
      number: contact.number || "",
      email: contact.email || "",
      company: contact.company || "",
      favorite: contact.favorite || false,
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => {
      const updated = [newContact, ...prev];
      saveContacts(updated);
      return updated;
    });
    return newContact;
  }, []);

  const updateContact = useCallback((id, updates) => {
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      saveContacts(updated);
      return updated;
    });
  }, []);

  const deleteContact = useCallback((id) => {
    setContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveContacts(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((id) => {
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, favorite: !c.favorite } : c
      );
      saveContacts(updated);
      return updated;
    });
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.number?.includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  });

  // Sort: favorites first, then alphabetically
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <ContactsContext.Provider
      value={{
        contacts: sortedContacts,
        allContacts: contacts,
        searchQuery,
        setSearchQuery,
        addContact,
        updateContact,
        deleteContact,
        toggleFavorite,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error("useContacts must be used within ContactsProvider");
  }
  return context;
}
