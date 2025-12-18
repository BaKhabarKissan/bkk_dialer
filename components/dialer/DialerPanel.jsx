"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
} from "lucide-react";
import { CallStatus } from "@/lib/sip/useSip";
import { useSipConfig, useSettings } from "@/lib/store/hooks";

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

export default function DialerPanel({ isOpen, onClose, initialNumber = "", sipState }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDND, setIsDND] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const prevInitialNumberRef = useRef(initialNumber);

  const { isConfigured, isLoaded } = useSipConfig();
  const { settings } = useSettings();

  // Use SIP state passed from parent
  const {
    callStatus,
    isMuted,
    isOnHold,
    isRecording,
    callDirection,
    remoteNumber,
    isRegistered,
    isInCall,
    call,
    answer,
    hangup,
    reject,
    toggleMute,
    toggleHold,
    toggleRecording,
    sendDTMF,
  } = sipState;

  const dialClickSound = useRef(null);

  // Update phone number when initialNumber changes
  useEffect(() => {
    const hasNewNumber = initialNumber && initialNumber !== prevInitialNumberRef.current;
    if (hasNewNumber && !isInCall) {
      // Defer state update to avoid cascading renders
      queueMicrotask(() => setPhoneNumber(initialNumber));
    }
    prevInitialNumberRef.current = initialNumber;
  }, [initialNumber, isInCall]);

  // Initialize dial click sound
  useEffect(() => {
    dialClickSound.current = new Audio("/sounds/dial-click.mp3");
    dialClickSound.current.volume = 0.5;
  }, []);

  // Auto-reject incoming calls when DND is enabled
  useEffect(() => {
    if (isDND && callStatus === CallStatus.RINGING && callDirection === "incoming") {
      reject();
    }
  }, [isDND, callStatus, callDirection, reject]);

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
    reject();
  }, [reject]);

  // Keyboard shortcuts (only when panel is open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        setActiveKey(key);
        handleDigitPress(key);
        setTimeout(() => setActiveKey(null), 150);
      } else if (key === "*" || key === "#") {
        e.preventDefault();
        setActiveKey(key);
        handleDigitPress(key);
        setTimeout(() => setActiveKey(null), 150);
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
          onClose();
        }
      } else if (key.toLowerCase() === "m" && isInCall) {
        e.preventDefault();
        toggleMute();
      } else if (key.toLowerCase() === "h" && isInCall) {
        e.preventDefault();
        toggleHold();
      } else if (key.toLowerCase() === "r" && isInCall) {
        e.preventDefault();
        toggleRecording();
      } else if (key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDND((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDigitPress, handleBackspace, handleCall, handleAnswer, handleReject, isInCall, callStatus, callDirection, hangup, toggleMute, toggleHold, toggleRecording, onClose]);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={!isInCall ? onClose : undefined}
          />

          {/* Dialer Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed right-8 bottom-24 z-50"
          >
            <Card className="w-80 p-5 shadow-2xl border-2">
              {/* Close Button */}
              {!isInCall && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              {/* Display */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4 mt-4">
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
                      "text-2xl font-mono tracking-wider flex-1",
                      displayNumber ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {formatPhoneNumber(displayNumber) || "___-___-____"}
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
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={isMuted ? "default" : "outline"}
                    className={cn("flex-1 gap-1 h-9 text-sm", isMuted && "bg-primary")}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    variant={isOnHold ? "default" : "outline"}
                    className={cn("flex-1 gap-1 h-9 text-sm", isOnHold && "bg-primary")}
                    onClick={toggleHold}
                  >
                    {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isOnHold ? "Resume" : "Hold"}
                  </Button>
                  <Button
                    variant={isRecording ? "default" : "outline"}
                    className={cn(
                      "flex-1 gap-1 h-9 text-sm",
                      isRecording && "bg-destructive hover:bg-destructive/90"
                    )}
                    onClick={toggleRecording}
                  >
                    <Circle className={cn("w-3 h-3", isRecording && "fill-current")} />
                    {isRecording ? "Stop" : "Rec"}
                  </Button>
                </div>
              )}

              {/* DND Toggle (when not in call) */}
              {!isInCall && (
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={isDND ? "default" : "outline"}
                    className={cn(
                      "flex-1 gap-2 h-9",
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
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {dialPadButtons.map((btn) => (
                  <motion.div
                    key={btn.digit}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 w-full text-lg font-medium hover:bg-accent hover:border-primary transition-all flex flex-col items-center justify-center gap-0 rounded-md",
                        activeKey === btn.digit && "bg-accent border-primary"
                      )}
                      onClick={() => handleDigitPress(btn.digit)}
                    >
                      <span>{btn.digit}</span>
                      {btn.letters && (
                        <span className="text-[8px] font-normal text-muted-foreground tracking-widest">
                          {btn.letters}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Call Buttons */}
              {callStatus === CallStatus.RINGING && callDirection === "incoming" ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1 h-11 text-base font-medium gap-2"
                    onClick={handleReject}
                  >
                    <PhoneOff className="w-5 h-5" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 h-11 text-base font-medium gap-2 bg-green-600 hover:bg-green-700"
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
                    "w-full h-11 text-base font-medium gap-2",
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
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Add a SIP account to make calls
                </p>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
