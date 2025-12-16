"use client";

import { SipConfigProvider } from "@/lib/sip/SipContext";
import { CallLogsProvider } from "@/lib/sip/CallLogsContext";
import { SettingsProvider } from "@/lib/sip/SettingsContext";
import { ContactsProvider } from "@/lib/sip/ContactsContext";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SettingsProvider>
        <SipConfigProvider>
          <CallLogsProvider>
            <ContactsProvider>{children}</ContactsProvider>
          </CallLogsProvider>
        </SipConfigProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
