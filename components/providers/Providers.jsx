"use client";

import StoreProvider from "@/lib/store/StoreProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>{children}</StoreProvider>
    </ThemeProvider>
  );
}
