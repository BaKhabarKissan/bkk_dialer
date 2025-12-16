"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Circle,
  Delete,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  BellOff,
} from "lucide-react";
import useSip, { CallStatus, RegistrationStatus } from "@/lib/sip/useSip";
import { useSipConfig } from "@/lib/sip/SipContext";
import { useCallLogs } from "@/lib/sip/CallLogsContext";
import { useSettings } from "@/lib/sip/SettingsContext";
import ContactsSidebar from "./ContactsSidebar";
import AccountsSidebar from "./AccountsSidebar";

const dialPadButtons = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export default function Dialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDND, setIsDND] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const { config, isConfigured, isLoaded } = useSipConfig();
  const { addLog, updateLog } = useCallLogs();
  const { settings } = useSettings();

  const sip = useSip(config);
  const currentCallLogRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const {
    registrationStatus,
    callStatus,
    isMuted,
    isOnHold,
    callDirection,
    remoteNumber,
    isRegistered,
    isInCall,
    connect,
    disconnect,
    call,
    answer,
    hangup,
    reject,
    toggleMute,
    toggleHold,
    sendDTMF,
  } = sip;

  const dialClickSound = useRef(null);
  const ringtoneSound = useRef(null);

  // Initialize sounds
  useEffect(() => {
    dialClickSound.current = new Audio("/sounds/dial-click.mp3");
    dialClickSound.current.volume = 0.5;
    ringtoneSound.current = new Audio(settings.ringtone || "/sounds/ringtone.mp3");
    ringtoneSound.current.loop = true;
    ringtoneSound.current.volume = settings.ringtoneVolume / 100;
  }, [settings.ringtone, settings.ringtoneVolume]);

  // Auto-connect when config is available
  useEffect(() => {
    if (isLoaded && isConfigured && registrationStatus === RegistrationStatus.UNREGISTERED) {
      connect();
    }
  }, [isLoaded, isConfigured, registrationStatus, connect]);

  // Play ringtone for incoming calls
  useEffect(() => {
    if (callStatus === CallStatus.RINGING && callDirection === "incoming" && !isDND) {
      ringtoneSound.current?.play().catch(() => { });
    } else {
      ringtoneSound.current?.pause();
      if (ringtoneSound.current) {
        ringtoneSound.current.currentTime = 0;
      }
    }
  }, [callStatus, callDirection, isDND]);

  // Auto-reject incoming calls when DND is enabled
  useEffect(() => {
    if (isDND && callStatus === CallStatus.RINGING && callDirection === "incoming") {
      reject();
    }
  }, [isDND, callStatus, callDirection, reject]);

  // Call logging
  useEffect(() => {
    // Call started (connecting or ringing)
    if (
      (callStatus === CallStatus.CONNECTING || callStatus === CallStatus.RINGING) &&
      !currentCallLogRef.current
    ) {
      const log = addLog({
        number: remoteNumber || phoneNumber,
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
  }, [callStatus, callDirection, remoteNumber, phoneNumber, addLog, updateLog]);

  const playDialSound = useCallback(() => {
    if (dialClickSound.current) {
      dialClickSound.current.currentTime = 0;
      dialClickSound.current.play().catch(() => { });
    }
  }, []);

  const handleDigitPress = useCallback(
    (digit) => {
      playDialSound();
      // Send DTMF if in call
      if (callStatus === CallStatus.IN_CALL) {
        sendDTMF(digit);
      }
      if (phoneNumber.length < 15) {
        setPhoneNumber((prev) => prev + digit);
      }
    },
    [phoneNumber.length, playDialSound, callStatus, sendDTMF]
  );

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (isInCall) {
      hangup();
    } else if (phoneNumber.length > 0 && isRegistered) {
      call(phoneNumber);
    }
  }, [isInCall, phoneNumber, isRegistered, call, hangup]);

  const handleAnswer = useCallback(() => {
    answer();
  }, [answer]);

  const handleReject = useCallback(() => {
    if (currentCallLogRef.current) {
      updateLog(currentCallLogRef.current, { status: "rejected" });
    }
    reject();
  }, [reject, updateLog]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigitPress(key);
      } else if (key === "*" || key === "#") {
        e.preventDefault();
        handleDigitPress(key);
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Enter") {
        e.preventDefault();
        if (callStatus === CallStatus.RINGING && callDirection === "incoming") {
          handleAnswer();
        } else {
          handleCall();
        }
      } else if (key === "Escape") {
        e.preventDefault();
        if (isInCall) {
          hangup();
        } else if (callStatus === CallStatus.RINGING) {
          handleReject();
        } else {
          setPhoneNumber("");
        }
      } else if (key.toLowerCase() === "m" && isInCall) {
        e.preventDefault();
        toggleMute();
      } else if (key.toLowerCase() === "h" && isInCall) {
        e.preventDefault();
        toggleHold();
      } else if (key.toLowerCase() === "r" && isInCall) {
        e.preventDefault();
        setIsRecording((prev) => !prev);
      } else if (key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDND((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleCall, handleAnswer, handleReject, isInCall, callStatus, callDirection, hangup, toggleMute, toggleHold]);

  const formatPhoneNumber = (number) => {
    if (number.length === 0) return "";
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const getCallStatusBadge = () => {
    if (callStatus === CallStatus.RINGING) {
      return callDirection === "incoming" ? (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse">
          <PhoneIncoming className="w-3 h-3 mr-1" />
          Incoming Call
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <PhoneOutgoing className="w-3 h-3 mr-1" />
          Ringing
        </Badge>
      );
    }
    if (callStatus === CallStatus.CONNECTING) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting
        </Badge>
      );
    }
    if (callStatus === CallStatus.IN_CALL || callStatus === CallStatus.ON_HOLD) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          {callStatus === CallStatus.ON_HOLD ? "On Hold" : "In Call"}
        </Badge>
      );
    }
    return null;
  };

  const displayNumber = isInCall || callStatus === CallStatus.RINGING
    ? remoteNumber || phoneNumber
    : phoneNumber;

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex">
      {/* Left Panel - Contacts */}
      <ContactsSidebar onCallNumber={(number) => setPhoneNumber(number)} />

      {/* Main Panel - Dialer */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6 shadow-lg">
          {/* Display */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              {getCallStatusBadge() || (
                <span className="text-xs text-muted-foreground">
                  {isRegistered ? "Enter number" : "Not connected"}
                </span>
              )}
              <div className="flex items-center gap-2">
                {isDND && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                    <BellOff className="w-3 h-3 mr-1" />
                    DND
                  </Badge>
                )}
                {isRecording && isInCall && (
                  <div className="flex items-center gap-1 text-destructive">
                    <Circle className="w-3 h-3 fill-destructive animate-pulse" />
                    <span className="text-xs">REC</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-3xl font-mono tracking-wider flex-1",
                  displayNumber ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {formatPhoneNumber(displayNumber)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleBackspace}
                disabled={phoneNumber.length === 0 || isInCall}
              >
                <Delete className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* In-Call Controls */}
          {isInCall && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={isMuted ? "default" : "outline"}
                className={cn("flex-1 gap-2", isMuted && "bg-primary")}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button
                variant={isOnHold ? "default" : "outline"}
                className={cn("flex-1 gap-2", isOnHold && "bg-primary")}
                onClick={toggleHold}
              >
                {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isOnHold ? "Resume" : "Hold"}
              </Button>
              <Button
                variant={isRecording ? "default" : "outline"}
                className={cn(
                  "flex-1 gap-2",
                  isRecording && "bg-destructive hover:bg-destructive/90"
                )}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Circle className={cn("w-4 h-4", isRecording && "fill-current")} />
                {isRecording ? "Stop" : "Rec"}
              </Button>
            </div>
          )}

          {/* DND Toggle (when not in call) */}
          {!isInCall && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={isDND ? "default" : "outline"}
                className={cn(
                  "flex-1 gap-2",
                  isDND && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => setIsDND(!isDND)}
              >
                <BellOff className="w-4 h-4" />
                {isDND ? "DND On" : "DND Off"}
              </Button>
            </div>
          )}

          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {dialPadButtons.map((btn) => (
              <Button
                key={btn.digit}
                variant="secondary"
                className="h-14 text-lg font-medium hover:bg-accent transition-colors flex flex-col items-center justify-center gap-0"
                onClick={() => handleDigitPress(btn.digit)}
              >
                <span>{btn.digit}</span>
                {btn.letters && (
                  <span className="text-[9px] font-normal text-muted-foreground tracking-widest">
                    {btn.letters}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Call Buttons */}
          {callStatus === CallStatus.RINGING && callDirection === "incoming" ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1 h-12 text-base font-medium gap-2"
                onClick={handleReject}
              >
                <PhoneOff className="w-5 h-5" />
                Reject
              </Button>
              <Button
                className="flex-1 h-12 text-base font-medium gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleAnswer}
              >
                <Phone className="w-5 h-5" />
                Answer
              </Button>
            </div>
          ) : (
            <Button
              variant={isInCall ? "destructive" : "default"}
              className={cn(
                "w-full h-12 text-base font-medium gap-2",
                !isInCall && "bg-green-600 hover:bg-green-700"
              )}
              onClick={handleCall}
              disabled={(!isInCall && phoneNumber.length === 0) || (!isInCall && !isRegistered)}
            >
              {isInCall ? (
                <>
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Call
                </>
              )}
            </Button>
          )}

          {/* Not Configured Message */}
          {!isConfigured && isLoaded && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Add a SIP account to make calls
            </p>
          )}
        </Card>
      </div>

      {/* Right Panel - Accounts */}
      <AccountsSidebar
        registrationStatus={registrationStatus}
        isRegistered={isRegistered}
        onConnect={connect}
        onDisconnect={disconnect}
        onCallNumber={(number) => setPhoneNumber(number)}
      />
    </div>
  );
}
