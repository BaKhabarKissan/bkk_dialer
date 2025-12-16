"use client";

import { SipConfigProvider } from "@/lib/sip/SipContext";
import { CallLogsProvider } from "@/lib/sip/CallLogsContext";
import { SettingsProvider } from "@/lib/sip/SettingsContext";
import { ContactsProvider } from "@/lib/sip/ContactsContext";

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <SipConfigProvider>
        <CallLogsProvider>
          <ContactsProvider>{children}</ContactsProvider>
        </CallLogsProvider>
      </SipConfigProvider>
    </SettingsProvider>
  );
}
