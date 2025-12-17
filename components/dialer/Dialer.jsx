"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, X } from "lucide-react";
import useSip, { CallStatus, RegistrationStatus } from "@/lib/sip/useSip";
import { useSipConfig } from "@/lib/sip/SipContext";
import { useSettings } from "@/lib/sip/SettingsContext";
import { useCallLogs } from "@/lib/sip/CallLogsContext";
import ContactsSidebar from "./ContactsSidebar";
import AccountsSidebar from "./AccountsSidebar";
import CallHistory from "./CallHistory";
import DialerPanel from "./DialerPanel";
import CallDialog from "./CallDialog";

export default function Dialer() {
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("");

  const { config, isConfigured, isLoaded, activeAccountId } = useSipConfig();
  const { settings } = useSettings();
  const { addLog, updateLog } = useCallLogs();

  const currentCallLogRef = useRef(null);
  const callStartTimeRef = useRef(null);

  const sip = useSip(config);
  const {
    registrationStatus,
    callStatus,
    callDirection,
    remoteNumber,
    isMuted,
    isSpeakerMuted,
    isOnHold,
    isRegistered,
    isInCall,
    connect,
    disconnect,
    call,
    answer,
    hangup,
    reject,
    toggleMute,
    toggleSpeaker,
    toggleHold,
    sendDTMF,
  } = sip;

  const hasInitialConnectRef = useRef(false);
  const ringtoneSound = useRef(null);

  // Initialize ringtone for incoming call detection
  useEffect(() => {
    ringtoneSound.current = new Audio(settings.ringtone || "/sounds/ringtone.mp3");
    ringtoneSound.current.loop = true;
    ringtoneSound.current.volume = settings.ringtoneVolume / 100;
  }, [settings.ringtone, settings.ringtoneVolume]);

  // Reset connect ref when account changes
  useEffect(() => {
    hasInitialConnectRef.current = false;
  }, [activeAccountId]);

  // Auto-connect once when config is available
  useEffect(() => {
    if (isLoaded && isConfigured && !hasInitialConnectRef.current && registrationStatus === RegistrationStatus.UNREGISTERED) {
      hasInitialConnectRef.current = true;
      connect();
    }
  }, [isLoaded, isConfigured, registrationStatus, connect]);

  // Auto-open dialer on incoming call
  const prevCallStatusRef = useRef(callStatus);
  useEffect(() => {
    const wasIdle = prevCallStatusRef.current === CallStatus.IDLE;
    const isNowRinging = callStatus === CallStatus.RINGING && callDirection === "incoming";

    if (wasIdle && isNowRinging) {
      // Defer state update to avoid cascading renders
      queueMicrotask(() => setIsDialerOpen(true));
    }
    prevCallStatusRef.current = callStatus;
  }, [callStatus, callDirection]);

  // Call logging
  useEffect(() => {
    // Call started (connecting or ringing)
    if (
      (callStatus === CallStatus.CONNECTING || callStatus === CallStatus.RINGING) &&
      !currentCallLogRef.current
    ) {
      const log = addLog({
        number: remoteNumber || selectedNumber,
        direction: callDirection || "outgoing",
        status: callStatus === CallStatus.RINGING && callDirection === "incoming" ? "ringing" : "connecting",
        info: "",
      });
      currentCallLogRef.current = log.id;
    }

    // Call connected - start timing
    if (callStatus === CallStatus.IN_CALL && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      if (currentCallLogRef.current) {
        updateLog(currentCallLogRef.current, { status: "in_progress" });
      }
    }

    // Call ended
    if (callStatus === CallStatus.IDLE && currentCallLogRef.current) {
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      updateLog(currentCallLogRef.current, {
        duration,
        status: duration > 0 ? "completed" : "missed",
      });

      currentCallLogRef.current = null;
      callStartTimeRef.current = null;
    }
  }, [callStatus, callDirection, remoteNumber, selectedNumber, addLog, updateLog]);

  // Handle answer call
  const handleAnswer = useCallback(() => {
    answer();
  }, [answer]);

  // Handle reject call
  const handleReject = useCallback(() => {
    if (currentCallLogRef.current) {
      updateLog(currentCallLogRef.current, { status: "rejected" });
    }
    reject();
  }, [reject, updateLog]);

  // Handle calling a number from history or contacts
  const handleCallNumber = useCallback((number) => {
    setSelectedNumber(number);
    setIsDialerOpen(true);
  }, []);

  // Toggle dialer
  const toggleDialer = useCallback(() => {
    if (!isDialerOpen) {
      setSelectedNumber("");
    }
    setIsDialerOpen((prev) => !prev);
  }, [isDialerOpen]);

  // Close dialer (only if not in call)
  const closeDialer = useCallback(() => {
    if (!isInCall) {
      setIsDialerOpen(false);
    }
  }, [isInCall]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex">
      {/* Left Panel - Contacts */}
      <ContactsSidebar onCallNumber={handleCallNumber} />

      {/* Main Panel - Call History */}
      <div className="flex-1 flex flex-col">
        <CallHistory onCallNumber={handleCallNumber} />
      </div>

      {/* Right Panel - Accounts */}
      <AccountsSidebar
        registrationStatus={registrationStatus}
        isRegistered={isRegistered}
        onConnect={connect}
        onDisconnect={disconnect}
        onCallNumber={handleCallNumber}
      />

      {/* Floating Dialer Button */}
      <motion.div
        className="fixed right-8 bottom-10 z-30"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {!isDialerOpen ? (
            <motion.div
              key="dial-button"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                size="lg"
                className={cn(
                  "h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-shadow",
                  "bg-green-600 hover:bg-green-700",
                  callStatus === CallStatus.RINGING && callDirection === "incoming" && "animate-pulse bg-blue-600 hover:bg-blue-700"
                )}
                onClick={toggleDialer}
              >
                <Phone className="w-7 h-7" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="close-button"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  "h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-shadow",
                  isInCall && "pointer-events-none opacity-50"
                )}
                onClick={closeDialer}
                disabled={isInCall}
              >
                <X className="w-7 h-7" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status Indicator */}
        <motion.div
          className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
            isRegistered ? "bg-green-500" : "bg-amber-500"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />
      </motion.div>

      {/* Dialer Panel */}
      <DialerPanel
        isOpen={isDialerOpen}
        onClose={closeDialer}
        initialNumber={selectedNumber}
        sipState={{
          registrationStatus,
          callStatus,
          callDirection,
          remoteNumber,
          isMuted,
          isOnHold,
          isRegistered,
          isInCall,
          call,
          answer,
          hangup,
          reject,
          toggleMute,
          toggleHold,
          sendDTMF,
        }}
      />

      {/* Global Call Dialog - Shows during any call state */}
      <CallDialog
        isOpen={
          callStatus === CallStatus.RINGING ||
          callStatus === CallStatus.CONNECTING ||
          callStatus === CallStatus.IN_CALL
        }
        direction={callDirection || "outgoing"}
        status={
          callStatus === CallStatus.RINGING
            ? "ringing"
            : callStatus === CallStatus.CONNECTING
            ? "connecting"
            : "in_call"
        }
        callerName={null}
        callerNumber={remoteNumber || selectedNumber}
        onAnswer={handleAnswer}
        onReject={handleReject}
        onHangup={hangup}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        isMuted={isMuted}
        isSpeakerMuted={isSpeakerMuted}
      />
    </div>
  );
}
