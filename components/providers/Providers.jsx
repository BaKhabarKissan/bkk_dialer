"use client";

import { SipConfigProvider } from "@/lib/sip/SipContext";
import { CallLogsProvider } from "@/lib/sip/CallLogsContext";
import { SettingsProvider } from "@/lib/sip/SettingsContext";

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <SipConfigProvider>
        <CallLogsProvider>{children}</CallLogsProvider>
      </SipConfigProvider>
    </SettingsProvider>
  );
}
