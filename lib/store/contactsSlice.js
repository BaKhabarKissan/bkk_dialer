"use client";

import { createSlice, createSelector } from "@reduxjs/toolkit";

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

const initialState = {
  contacts: [],
  searchQuery: "",
};

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    initializeContacts: (state) => {
      state.contacts = getStoredContacts();
    },
    addContact: (state, action) => {
      const newContact = {
        id: action.payload.id || Date.now().toString(),
        name: action.payload.name || "",
        number: action.payload.number || "",
        email: action.payload.email || "",
        company: action.payload.company || "",
        favorite: action.payload.favorite || false,
        createdAt: action.payload.createdAt || new Date().toISOString(),
      };
      state.contacts = [newContact, ...state.contacts];
    },
    updateContact: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.contacts.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.contacts[index] = { ...state.contacts[index], ...updates };
      }
    },
    deleteContact: (state, action) => {
      state.contacts = state.contacts.filter((c) => c.id !== action.payload);
    },
    toggleFavorite: (state, action) => {
      const index = state.contacts.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.contacts[index].favorite = !state.contacts[index].favorite;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  initializeContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  setSearchQuery,
} = contactsSlice.actions;

// Base selectors
export const selectAllContacts = (state) => state.contacts.contacts;
export const selectSearchQuery = (state) => state.contacts.searchQuery;

// Memoized selector for filtered and sorted contacts
export const selectContacts = createSelector(
  [selectAllContacts, selectSearchQuery],
  (contacts, searchQuery) => {
    // Filter contacts based on search query
    const filtered = contacts.filter((contact) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.number?.includes(query) ||
        contact.company?.toLowerCase().includes(query)
      );
    });

    // Sort: favorites first, then alphabetically
    return [...filtered].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }
);

export default contactsSlice.reducer;
